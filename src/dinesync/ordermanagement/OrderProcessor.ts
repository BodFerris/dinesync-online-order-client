import { OrderDTO, OrderGroupDTO, OrderStateEnum, orderStatePositionList} from '../dto/OrderDTO';
import { OrderHelper } from '../dto/utility/OrderHelper';

// TODO: Need to remove dependence from NextUx or ensure that only
// utiltiy methods are used for amything in the dinesync folder
import { Debug, NumUtility } from '@/next-ux2/utility';
import { InventoryItem } from '../dto/MenuDTO';

export class OrderProcessor {

    constructor(
        private _isAutoClosedWithZeroBalance: boolean, 
        private _defaultTaxRate: number,
        private _isTipAllowed: boolean) {

    }

    private getTicketPaymentHash(ticket: OrderGroupDTO): string {
        return ticket.totalPrice.toString() 
               + ticket.tax.toString()
               + ticket.untaxedTotal.toString()
               + ticket.totalPaid.toString()
               + ticket.totalTip.toString();
    }

    private getOrderaymentHash(order: OrderDTO): string {
        return order.totalPrice.toString() 
               + order.totalTax.toString()
               + order.untaxedTotal.toString()
               + order.totalPaid.toString()
               + order.totalTip.toString();
    }

    public updateTotals(order: OrderDTO, inventoryList: Array<InventoryItem>) {
        let areAllTicketsPaidInFull = true;
        order.groupList.forEach((ticketItem) => {
            let originalTicketPaymentHash = this.getTicketPaymentHash(ticketItem);

            let ticketTotal = OrderHelper.getTicketTotals(ticketItem, this._defaultTaxRate);
            ticketItem.totalPrice = ticketTotal.totalPrice;
            ticketItem.tax = ticketTotal.adjustedTax;
            ticketItem.untaxedTotal = ticketTotal.untaxedTotal;
            ticketItem.totalPaid = ticketTotal.totalPaid;
            ticketItem.totalTip = ticketTotal.totalTip;

            let ticketBalance = OrderHelper.getTicketBalance(ticketItem);
            ticketItem.isPaidInFull = NumUtility.isZero(ticketBalance);

            areAllTicketsPaidInFull = areAllTicketsPaidInFull && ticketItem.isPaidInFull;

            let ticketPaymentHash = this.getTicketPaymentHash(ticketItem);
            if (originalTicketPaymentHash !== ticketPaymentHash) {
                ticketItem.lastModified = Date.now();
            }

            OrderHelper.updateTicketSearchOptimizationKeyList(ticketItem, inventoryList);
        });

        order.isPaidInFull = areAllTicketsPaidInFull;

        let originalOrderPaymentHash = this.getOrderaymentHash(order);

        let orderTotals = OrderHelper.getOrderTotals(order);
        order.totalPrice = orderTotals.totalPrice;
        order.totalTax = orderTotals.adjustedTax;
        order.untaxedTotal = orderTotals.untaxedTotal;
        order.totalPaid = orderTotals.totalPaid;
        order.totalTip = orderTotals.totalTip;

        OrderHelper.updateOrderAggregators(order);

        let orderPaymentHash = this.getOrderaymentHash(order);
        if (originalOrderPaymentHash !== orderPaymentHash) {
            order.lastModified = Date.now();
        }
    }

    private updateTicketState(ticket: OrderGroupDTO, inventoryList: Array<InventoryItem>) {
        // if there are no payments, then do not process
        if (ticket.paymentList.length === 0) {
            return;
        }

        let previousState = ticket.status;

        // waitingForFullPayment: has an unpaid balance; or zero balance with no menu items
        // waitingForCloseOut: has zero balance and menu items
        // closed: zero balance with auto close turned on
        if (OrderHelper.getTicketBalance(ticket) > 0) {
            ticket.status = OrderStateEnum.waitingForFullPayment;
        }
        else if ((ticket.menuItemList.length > 0) && (ticket.totalPrice > 0)) {
            // balance is zero with menu items that have price, so 
            // it will either be waiting-for-close-out or closed
            if (this._isAutoClosedWithZeroBalance && !this._isTipAllowed) {
                ticket.status = OrderStateEnum.closed;
            }
            else {
                // if all the payments are closed, then the ticket is closed
                let openPayment = ticket.paymentList.find( x => !x.isClosed);
                if (!openPayment) {
                    ticket.status = OrderStateEnum.closed;
                }
                else {
                    ticket.status = OrderStateEnum.waitingForCloseOut;   
                }
            }
        }

        OrderHelper.updateTicketSearchOptimizationKeyList(ticket, inventoryList);

        if (ticket.status !== previousState) {
            ticket.lastModified = Date.now();
        }
    }

    public updateState(order: OrderDTO, inventoryList: Array<InventoryItem>) {
        let leastOrderStatePosition = orderStatePositionList.length - 1;
        order.groupList.forEach((ticket) => {
            this.updateTicketState(ticket, inventoryList);

            // keep track of the state of the ticket farthest from being closed
            let stateIndex = orderStatePositionList.indexOf(<any>(ticket.status));
            if (stateIndex < leastOrderStatePosition) {
                leastOrderStatePosition = stateIndex;
            }
        });

        // order state is the state of any ticket
        // that is farthest from being closed
        let previousOrderStatus = order.status;
        let currentOrderStatus =  orderStatePositionList[leastOrderStatePosition];
        if (previousOrderStatus !== currentOrderStatus) {
            order.status = currentOrderStatus;
            order.lastModified = Date.now();
        }
    } 

    public handleTicketMutated(ticket: OrderGroupDTO, order: OrderDTO, inventoryList: Array<InventoryItem>) {
        this.updateTotals(order, inventoryList);
        this.updateState(order, inventoryList);

        ticket.lastModified = Date.now();
        order.lastModified = Date.now();
    }
}