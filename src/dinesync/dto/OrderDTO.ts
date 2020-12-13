import { IIngredient, IOptionShared, IOptionGroupShared } from './MenuDTO';

// TODO: DiscountType is deprecated, using DiscountTypeEnum
export type DiscountType = '' | 'fullDiscountType' | 'customDiscountType' | 'percentOfTotalDiscountType';

export enum DiscountTypeEnum {
    unset = '',
    fullDiscountType = 'fullDiscountType',
    customDiscountType = 'customDiscountType',
    percentOfTotalDiscountType ='percentOfTotalDiscountType'
}

export type OrderApplyToType = '' | 'entireOrder' | 'specificMenuItem';

export type PrinterDestinationType = '' | 'primaryKitchen' | 'secondaryKitchen' | 'bar' | 'none';

export enum OrderStateEnum {
    waitingForFullPayment = 'waitingForFullPayment',
    waitingForPickup = 'waitingForPickup',
    waitingForCloseOut = 'waitingForCloseOut',
    closed = 'closed',
    voided = 'void'
}

export enum OrderTypeEnum {
    DineIn = 'Dine-In',
    CarryOut = 'Carry-Out',
    Delivery = 'Delivery'
}

export enum PayTransationTypeEnum {
    payByCash = 'payByCash',
    payByCard = 'payByCard',
    payByGift = 'payByGift',

    refundByCard = 'refundByCard',
    refundByCash = 'refundByCash',
    refundByGift = 'refundByGift'
}

export enum  PaymentClosedReason {
    voided = 'voided',
    transactionComplete = 'transactionComplete'
}

export enum PaymentState {
    open = 'open',
    closed = 'closed'

}

export const orderStatePositionList = [
        'waitingForFullPayment',
        'waitingForCloseOut',
        'waitingForPickup',
        'closed'
    ];

export interface ISearchOptimizationKey {
    id: string;
    parentId: string;
    typeName: string;
}

export class SearchOptimizationKeyDTO implements ISearchOptimizationKey {
    public id: string = '';
    public parentId: string = '';
    public typeName = 'SearchOptimizationKeyDTO';
}

export interface IAggregation {
    id: string;
    parentId: string;
    amount: number;
    typeName: string;
}

export class AggregationDTO implements IAggregation {
    public id: string = '';
    public parentId: string = '';
    public amount: number = 0;
    public typeName: string = 'AggregationDTO';
}

export interface IOptionGroupQuantityInfo {
    size: string;
    minOptionsAllowed: number;
    maxOptionsAllowed: number;
    maxQuantityBeforeCharging: number,
    price: number
}

export interface IOrderMenuItemOptionGroup extends IOptionGroupShared {
    id: string;
    parentId: string;
    position: number;
    optionList: Array<IOrderMenuItemOption>;
    typeName: string;
}

export class OrderMenuItemOptionGroupDTO implements IOrderMenuItemOptionGroup {
    public id: string = '';
    public parentId: string = '';
    public name: string = '';
    public quantityInfoList = new Array<IOptionGroupQuantityInfo>();
    public position: number = 0;
    public optionList: Array<IOrderMenuItemOption> = [];
    public typeName: string = 'OrderMenuItemOptionGroupDTO';
}

export interface IOptionQuantityInfo {
    size: string,
    minExpectedQuantity: number,
    maxQuantityAllowed: number,
    maxQuantityBeforeCharging: number,
    defaultQuantity: number,
    price: number
}

export interface IOrderMenuItemOption extends IOptionShared  {
    id: string;
    parentId: string;
    price: number;
    isSelected: boolean;
    isSelectedByDefault: boolean;
    isMoreThanOne: boolean;
    amount: number;
    position: number;
    isQuantityWordUsed: boolean;
    quantityWordRange: string;
    selectedQuantityWord: string;
    selectedQuantityInfo: IOptionQuantityInfo;
    optionGroupList: Array<IOrderMenuItemOptionGroup>;
    
    isBarItem: boolean;
    originalBarItemInfo: {name: string, pricePerUnit: number};

    typeName: string;
}

export class OrderMenuItemOptionDTO implements IOrderMenuItemOption {
    public id: string = '';
    public parentId: string = '';
    public name: string = '';
    public price: number = 0;
    public quantityInfoList = new Array<IOptionQuantityInfo>();
    public sizeToIngredientList: Array<{size: string, ingredientList: Array<IIngredient>}> = [];
    public isSelected: boolean = false;
    public isSelectedByDefault: boolean = false;
    public isMoreThanOne: boolean = false;
    public amount: number = 1;
    public position: number = 0;
    public isQuantityWordUsed: boolean = false;
    public quantityWordRange = '';
    public selectedQuantityWord = '';
    public selectedQuantityInfo: IOptionQuantityInfo = {
        size: '',
        minExpectedQuantity: 0,
        maxQuantityAllowed: 0,
        maxQuantityBeforeCharging: 0,
        defaultQuantity: 0,
        price: 0 };
    public optionGroupList: Array<IOrderMenuItemOptionGroup> = [];

    public isBarItem: boolean = false;
    public originalBarItemInfo = {name: '', pricePerUnit: 0};

    public typeName: string = 'OrderMenuItemOptionDTO';
}

export class OrderOptionItemInfo {
    public multiplyFactor = 1;
    public indent = 0;
    public parentOption: IOrderMenuItemOption | null = null;
    public group: IOrderMenuItemOptionGroup | null = null;
    public optionItem: IOrderMenuItemOption | null = null;
    public isIgnoredForKitchenPrint: boolean = false;
    public overrideName: string = '';
    public overridePrice: number= 0;
}

export interface IOrderOptionItemPrintInfo {
    title: string;
    quantity: string;
    isQuantityWordUsed: boolean;
    price: string;
    indent: number;
}


export interface ITransactionBase {
    id: string;
    transactionId: string;
    transactionId2: string;
    transactionId3: string;
    tokenizedCard: string;
    isVoid: boolean;
    voidTransactionId: string;
    paymentEndpoint: string;
}

export interface IOnlineTransactionInfo {
    transactionId: string;
    transactionId2: string;
    transactionId3: string;
    transactionTimestamp: number;
    chargeAmount: number;
    name: string;
    creditType: string;
    lastFour: string,
    cardExp: string,
    sendToEmail: string,
    textPhoneNumber: string
}

export interface IOnlineValidationResult
{
    isValid: boolean;
    failureReason: string;
    deviceName: string;
    signature: string;
}

export interface ICardTransaction extends ITransactionBase {
    parentId: string;
    batchId: string;
    invoiceId: string;
    creditType: string;
    
    nameOnCard: string;
    cardId: string;
    cardExp: string;
    cardObscured: string;
    cardPresentType: string;
    cardEntryMode: string;
    cardAuthCode: string,
    cardBalanceAmount: string;
    cardTerminalId: string;
    cardAid: string;
    cardTvr: string;
    cardIad: string;
    cardTsi: string;
    cardArc: string;
    cardCvm: string;

    customerId: string;
    type: string;
    timestamp: number;
    amount: number;

    typeName: string;
}

export class CardTransactionDTO implements ICardTransaction {
    public id: string = '';
    public parentId: string = '';
    public batchId: string = '';
    public transactionId: string = '';
    public transactionId2: string = '';
    public transactionId3: string = '';
    public invoiceId: string = '';
    public tokenizedCard: string = '';
    public creditType: string = '';
    public cardObscured: string = '';
    public customerId: string = '';
    public cardId: string = '';
    public nameOnCard: string = '';
    public cardExp: string = '';
    public cardPresentType: string = '';
    public cardEntryMode: string = '';
    public cardAuthCode: string = '';
    public cardBalanceAmount: string = '';
    public cardTerminalId: string = '';
    public cardAid: string = '';
    public cardTvr: string = '';
    public cardIad: string = '';
    public cardTsi: string = '';
    public cardArc: string = '';
    public cardCvm: string = '';
    public type: string = '';
    public timestamp: number = 0;
    public amount: number = 0;
    public isVoid: boolean = false;
    public voidTransactionId: string = '';
    public paymentEndpoint: string = '';
    public typeName: string = '';
}

export class AuthorizeTransactionDTO extends CardTransactionDTO {
    public type: string = 'Authorize';
    public typeName: string = 'AuthorizeTransactionDTO';
}

export class CaptureTransactionDTO extends CardTransactionDTO {
    public type: string = 'Capture';
    public parentTransactionId: string = '';
    public typeName: string = 'CaptureTransactionDTO';
}

export class SaleTransactionDTO extends CardTransactionDTO {
    public type: string = 'Sale';
    public typeName: string = 'SaleTransactionDTO';
}

export class RefundTransactionDTO extends CardTransactionDTO {
    public type: string = 'Refund';
    public parentTransactionId: string = '';
    public typeName: string = 'RefundTransactionDTO';
}

export interface IGiftCardAddValueTransaction extends ITransactionBase {
    parentId: string;
    restaurantId: string;
    cardObscured: string;
    paymentType: 'payByCard' | 'payByCash' | '';
    paymentTransactionId: string;
    paymentCardObscured: string;
    paymentTokenizedCard: string;
    amount: number;
    cardBalance: number;
    timestamp: number;
    typeName: string;
}

export class GiftCardAddValueTransactionDTO implements IGiftCardAddValueTransaction {
    public id: string = '';
    public parentId: string = '';
    public restaurantId: string = '';
    public tokenizedCard: string = '';
    public cardObscured: string = '';
    public paymentType: 'payByCard' | 'payByCash' | '' = '';
    public paymentTransactionId = '';
    public paymentCardObscured: string = '';
    public paymentTokenizedCard: string = '';
    public amount: number = 0;
    public cardBalance: number = 0;
    public timestamp: number = 0;
    public transactionId: string = '';
    public transactionId2: string = '';
    public transactionId3: string = '';
    public isVoid: boolean = false;
    public voidTransactionId: string = '';
    public paymentEndpoint: string = '';
    public typeName: string = 'GiftCardAddValueTransactionDTO'
}

export class GiftCardRedeemTransactionDTO extends CardTransactionDTO {
    public type: string = 'GiftCardRedeem';
    public typeName: string = 'GiftCardRedeemTransactionDTO';
    public cardBalance: number = 0;
}

export interface IGiftCard {
    id: string;
    parentId: string;
    lookupId: string;
    cardType: 'Gift' | '';
    issuer: string;
    firstName: string;
    lastName: string;
    address1: string;
    address2: string;
    city: string;
    state: string;
    zip: string;
    email: string;
    phone: string;
    cardNumber: string;
    expirationDate: number;
    issueDate: number;
    isVoid: boolean;
    typeName: string;
}

export class GiftCardDTO implements IGiftCard {
    public id: string = '';
    public parentId: string = '';
    public lookupId: string = '';
    public cardType: 'Gift' | '' = 'Gift';
    public issuer: string = '';
    public firstName: string = '';
    public lastName: string = '';
    public address1: string = '';
    public address2: string = '';
    public city: string = '';
    public state: string = '';
    public zip: string = '';
    public email: string = '';
    public phone: string = '';
    public cardNumber: string = '';
    public expirationDate: number = 0;
    public issueDate: number = 0;
    public isVoid: boolean = false;
    public typeName: string = 'GiftCardDTO';
}

export interface IBatchCloseInfo {
    id: string;
    parentId: string;
    timestamp: number;
    transactionId: string;
    previousBatchCloseTimestamp: number;
    typeName: string;
}

export class BatchCloseInfoDTO implements IBatchCloseInfo {
    public id: string = '';
    public parentId: string = '';
    public timestamp: number = 0;
    public transactionId: string = '';
    public previousBatchCloseTimestamp: number = 0;
    public typeName: string = 'BatchCloseInfoDTO';
}

export interface IDiscountSetting {
    id: string;
    parentId: string;
    name: string;
    applyTo: OrderApplyToType
    discountType: DiscountType;
    value: number;
    typeName: string
}

export class DiscountSettingDTO implements IDiscountSetting {
    public id: string = '';
    public parentId: string = '';
    public name: string = '';
    public applyTo: OrderApplyToType = '';
    public discountType: DiscountType = '';
    public value: number = 0;
    public typeName: string = 'DiscountSettingDTO';
}

export interface IDiscount {
    id: string;
    parentId: string;
    name: string;
    amount: number;
    totalAppliedTo: number;
    discountAppliedToType: string;
    discountType: string;
    typeName: string;
}

export class DiscountDTO implements IDiscount {
    public id: string = '';
    public parentId: string = '';
    public name: string = '';
    public amount: number = 0;
    public totalAppliedTo: number = 0;
    public discountAppliedToType: string = '';
    public discountType: string = '';
    public typeName: string = 'DiscountDTO';
}

export interface IPayment {
    id: string;
    parentId: string;
    orderId: string;
    restaurantId: string;
    customerId: string
    orderTakenTimestamp: number;
    serverId: string;
    posDeviceId: string;
    cashDrawerId: string;
    transactionTime: number;
    type: string;
    partialPaymentBalance: number;
    partialPaymentPercent: number;
    moneyAppliedToBill: number;
    moneyReturned: number;
    lastFour: string;
    nameOnCard: string;
    cardExp: string;
    cardId: string;
    cardPresentType: string;
    cardEntryMode: string;
    cardAuthCode: string;
    cardBalanceAmount: number;
    cardTerminalId: string;
    cardAid: string;
    cardTvr: string;
    cardIad: string;
    cardTsi: string;
    cardArc: string;
    cardCvm: string;
    tip: number;
    transactionType: string;
    state: string;
    closedReason: string;
    isFullyRefunded: boolean;
    isClosed: boolean;
    cardTransactionList: Array<ICardTransaction>;
    lastModified: number;
    typeName: string;
}

export class PaymentDTO implements IPayment {
    public id: string = '';
    public parentId: string = '';
    public orderId: string = '';
    public restaurantId: string = '';
    public customerId: string = '';
    public orderTakenTimestamp: number = 0;
    public serverId: string = '';
    public posDeviceId: string = '';
    public cashDrawerId: string = '';
    public transactionTime: number = 0;
    // type is deprecated
    public type: string = '';
    public partialPaymentBalance: number = 0;
    public partialPaymentPercent: number = 0;
    public moneyAppliedToBill: number = 0;
    public moneyReturned: number = 0;
    public lastFour: string = '';
    public nameOnCard: string = '';
    public cardExp: string = '';
    public cardId: string = '';
    public cardPresentType = '';
    public cardEntryMode = '';
    public cardAuthCode = '';
    public cardBalanceAmount = 0; 
    public cardTerminalId: string = '';
    public cardAid: string = '';
    public cardTvr: string = '';
    public cardIad: string = '';
    public cardTsi: string = '';
    public cardArc: string = '';
    public cardCvm: string = '';

    public tip: number = 0;
    public transactionType: string = '';
    public state: string = '';
    public closedReason: string = '';
    public isFullyRefunded: boolean = false;
    public isClosed: boolean = false;
    public cardTransactionList: Array<ICardTransaction> = [];
    public lastModified: number = 0;
    public typeName: string = 'PaymentDTO';
}


export interface IOrderMenuItem {
    id: string;
    parentId: string;
    menuItemId: string;
    menuCategory: string;
    priceList: Array<{price: number, size: string}>;
    name: string;
    profitCenter: string;
    course: string;
    areTaxesCoveredByPrice: boolean;
    printerDestination: PrinterDestinationType;
    price: number;
    size: string;
    amount: number;
    optionGroupList: Array<IOrderMenuItemOptionGroup>;
    sizeToIngredientList: Array<{size: string, ingredientList: Array<IIngredient>}>;
    discountList: Array<IDiscount>;
    specialNotes: string;
    isBarBeverage: boolean;

    lastModified: number;
    typeName: string;
}

export class OrderMenuItemDTO implements IOrderMenuItem {
    public id: string = '';
    public parentId: string = '';
    public menuItemId: string = '';
    public menuCategory: string = '';
    public priceList = new Array<{price: number, size: string}>();
    public name: string = '';
    public profitCenter: string = '';
    public course: string = '';
    public areTaxesCoveredByPrice: boolean = false;
    public printerDestination: PrinterDestinationType = '';
    public price: number = 0;
    public size: string = '';
    public amount: number = 0;
    public optionGroupList: Array<IOrderMenuItemOptionGroup> = [];
    public sizeToIngredientList: Array<{size: string, ingredientList: Array<IIngredient>}> = [];
    public discountList: Array<IDiscount> = [];
    public specialNotes: string = '';
    public isBarBeverage: boolean = false;

    public lastModified: number = 0;
    public typeName: string = 'OrderMenuItemDTO';
}

export interface IOrderGroupCore {
    id: string;
    parentId: string;
    restaurantId: string;
    customerId: string;
    orderNumber: string;
    orderTakenTimestamp: number;
    ticketTimestamp: number;
    ticketId: string;
    name: string;
    deliverMethod: string;
    status: string;
    isPaidInFull: boolean;
    doesKitchenNeedUpate: boolean;
    hasKitchenBeenPreviouslyNotiifed: boolean;
    totalPrice: number;
    tax: number;
    untaxedTotal: number;
    totalPaid: number;
    totalTip: number;

    serverName: string;

    lastModified: number;

    typeName: string;
}

export interface IOrderGroup extends IOrderGroupCore {
    menuItemList: Array<IOrderMenuItem>;
    paymentList: Array<IPayment>;
    discountList: Array<IDiscount>;

    // only used for search optimization
    restaurantId: string;
    serverName: string;
    paymentLastFourList: Array<ISearchOptimizationKey>;
    doesTicketIncludeLiquor: boolean,
    liquorUsageList:Array<{ name: string, className: string, units: number }>;

    lastModified: number;
}

export class OrderGroupDTO implements IOrderGroup {
    public id: string = '';
    public parentId: string = '';
    public customerId: string = '';
    public orderNumber: string = '';
    public orderTakenTimestamp: number = 0;
    public ticketTimestamp: number = 0;
    public ticketId: string = '';
    public name: string = '';
    public deliverMethod: string = '';
    public status: string = '';
    public isPaidInFull: boolean = false;
    public doesKitchenNeedUpate: boolean = false;
    public hasKitchenBeenPreviouslyNotiifed: boolean = false;
    public totalPrice: number = 0;
    public tax: number = 0;
    public untaxedTotal: number = 0;
    public totalPaid: number = 0;
    public totalTip: number = 0;
    public menuItemList: Array<IOrderMenuItem> = [];
    public paymentList: Array<IPayment> = [];
    public discountList: Array<IDiscount> = [];

    // only used for search optimization
    public restaurantId: string = '';
    public serverName: string = '';
    public paymentLastFourList: Array<ISearchOptimizationKey> = [];
    public doesTicketIncludeLiquor: boolean = false;
    public liquorUsageList:Array<{ name: string, className: string, units: number }> = [];

    public lastModified = 0;

    public typeName: string = 'OrderGroupDTO';
}

export interface IOrderCore {
    id: string;
    parentId: string;
    orderNumber: string;
    takenDate: number;
    kitchenCompleteDate: number;
    deliverDate: number;
    customerPickupTime: string;
    primaryCustomerName: string;
    orderType: string;
    status: string;
    deliverMethod: string;
    tableId: string;
    isPaidInFull: boolean;
    contactName: string;
    contactPhone: string;
    contactAddress: string;
    serverName: string;
    totalPrice: number;
    totalTax: number;
    untaxedTotal: number;
    totalPaid: number;
    totalTip: number;
    doesKitchenNeedUpate: boolean;
    hasItEverPrintedtoKitchen: boolean;
    currentCourse: string;
    isMulticourseUsed: boolean;
    lastModified: number;

    typeName: string;
}

export interface IOrder extends IOrderCore {
    groupList: Array<IOrderGroup>;

    categoryAggregation: Array<IAggregation>;
    profitCenterAggregation: Array<IAggregation>;
    discountAggregation: Array<IAggregation>;
}

export class OrderDTO implements IOrder {
    public id: string = '';
    public parentId: string = '';
    public orderNumber: string = '';
    public takenDate: number = 0;
    public kitchenCompleteDate: number = 0;
    public deliverDate: number = 0;
    public customerPickupTime: string = '';
    public primaryCustomerName: string = '';
    public orderType: string = '';
    public status: string = '';
    public deliverMethod: string = '';
    public tableId: string = '';
    public isPaidInFull: boolean = false;
    public contactName: string = '';
    public contactPhone: string = '';
    public contactAddress: string = '';
    public serverName: string = '';
    public totalPrice: number = 0;
    public totalTax: number = 0;
    public untaxedTotal: number = 0;
    public totalPaid: number = 0;
    public totalTip: number = 0;
    public doesKitchenNeedUpate: boolean = false;
    public hasItEverPrintedtoKitchen: boolean = false;
    public currentCourse: string = '';
    public isMulticourseUsed: boolean = false;
    public lastModified: number = 0;

    public groupList: Array<IOrderGroup> = [];

    public categoryAggregation: Array<IAggregation> = [];
    public profitCenterAggregation: Array<IAggregation> = [];
    public discountAggregation: Array<IAggregation> = [];

    public typeName: string = 'OrderDTO';
}

export class CashChangeInfoDTO {
    public id: string = '';
    public parentId: string = '';
    public amount: number = 0;
    public time: number = 0;
    public user: string = '';
    public reason: string = '';

    public typeName: string = 'CashChangeInfoDTO';
}

export class CashDrawerDTO {
    public id: string = '';
    public parentId: string = '';
    public restaurantId: string = '';
    public openDate: number = 0;
    public closeDate: number = 0;
    public openedByUser: string = '';
    public closedByUser: string = '';
    public startingCash: number = 0;
    public endingCash: number = 0;
    public cashRemovedList: Array<CashChangeInfoDTO> = [];
    public cashAddedList: Array<CashChangeInfoDTO> = [];
    public cashAddedTotal: number = 0;
    public cashRemovedTotal: number = 0;
    public cashPaymentTransactionTotal: number = 0;

    public lastModified: number = 0;
    public typeName: string = 'CashDrawerDTO';
}

export interface ITicketKitchenUpdateInfo {
    orderGroupId: string;
    itemsRemovedList: Array<IOrderMenuItem>;
    itemsAddedList: Array<IOrderMenuItem>;
    itemsAmountChangedList: Array<IOrderMenuItem>;
    itemsOptionChangedMap: { [menuItemId: string]: TicketKitcheUpdateOptionsInfo[] };
}

export class TicketKitcheUpdateOptionsInfo {
    menuItemId: string = '';
    printerDestination: PrinterDestinationType = '';
    optionGroupId: string = '';
    optionId: string = '';
    menuItemName: string = '';
    optionGroupName: string = '';
    propertyChangeName: string = '';
    optionName: string = '';
    orignalValue: string = '';
    newValue: string = '';
}


export interface IPaymentSearchCriteria {
    restaurantId: string,
    startTimestamp: number,
    endTimestamp: number,
    paymentAmount?: number,
    serverId?: string
}

export interface IPaymentSearchResult {
    id: string;
    orderId: string;
    parentId: string;
    orderNumber: string;
    ticketId: string;
    transactionType: string;
    nameOnCard: string;
    lastFour: string;
    moneyAppliedToBill: number;
    totalPrice: number;
    tax: number;
    tip: number;
    isFullyRefunded: boolean;
}

export interface IServerPaymentAggResult {
    serverId: string;
    cash: number,
    credit: number,
    refundCash: number,
    refundCard: number,
    cashTip: number;
    creditTip: number;
}

export interface IFilterBase {
    restaurantId: string;
    startTimestamp: number;
    endTimestamp: number;
}

export interface IOrderStatusFilter extends IFilterBase {
    status: string;
}

// NOTE: The following report DTO objects are not standard DTO
export class ReportAggBaseDTO {
    public id = '';
    public parentId = '';
    public localTimestamp = 0;
    public month = 0;
    public day = 0;
    public dayOfWeek = '';
    public reportStartTimestamp = 0;
    public reportEndTimestamp = 0;
}

export class SalesReportDayAggDTO extends ReportAggBaseDTO {
    public profitCenterList: { [name: string]: number } = {};
    public grossGiftAddValue = 0;
    public grossSales = 0;
    public salesTax = 0;
    public tips = 0;
    public discountList: { [name: string]: number } = {};
    public grossDiscounts = 0;
    public netSales = 0;
    public netTotal = 0;
    public typeName = 'SalesReportDayAggDTO';
}

export class DepositDayReportAggDTO extends ReportAggBaseDTO {
    public creditBreakdown: { [name: string]: number } = {};
    public creditSubtotal = 0;
    public creditRefund = 0;
    public totalCredit = 0;
    public cashReceived = 0;
    public cashRefund = 0;
    public giftRedeemed = 0;
    public giftRefund = 0;
    public giftCardAddViaCash = 0;
    public giftCardAddViaCard = 0;
    public tillOverShort = 0;
    public cashSubtotal = 0;
    public cashTip = 0;
    public creditTip = 0;
    public netDepositTotal = 0;

    public orderAverageBreakdown = {
        deliverySalesTotal: 0,
        deliverySalesCount: 0,
        carryOutSalesTotal: 0,
        carryOutSalesCount: 0,
        dineInSalesTotal: 0,
        dineInSalesCount: 0,
        allOrderSalesTotal: 0,
        allOrderSalesCount: 0,

        onlineSalesTotal: 0,
        onlineSalesCount: 0,
        onPremiseSalesTotal: 0,
        onPremiseSalesCount: 0
    };

    public orderCountByHourBreakdown = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    public typeName = 'DepositDayReportAggDTO';
}

export class DayReportAggStatusDTO {
    public id: string = '';
    public parentId: string = '';
    public firstAggTimestamp: number = 0;
    public lastAggTimestamp: number = 0;
    public lastAggDayReportTimestamp: number = 0;
    public timzoneOffset: number = 0;
    public typeName = 'DayReportAggStatusDTO';
}

export interface IServerOrderMenuItemCount {
    serverName: string;
    totalSold: string;
    totalPrice: string;
    avgSellPrice: string;
}

// I am not too sure what ReportOrderMenuItemDataPointDTO is used for
export class ReportOrderMenuItemDataPointDTO {
    public id: string = '';
    public parentId: string = '';
    public menuItemName: string = '';
    public basePrice: string = '';
    public orderTimestamp: number = 0;
    public ticketTimestamp: number = 0;
    public orderPrice: number = 0;
    public ticketPrice: number = 0;
    public serverName: string = '';

    public typeName = 'ReportOrderMenuItemDataPointDTO'
}

export class ReportOrderMenuItemDayAggItemDTO extends ReportAggBaseDTO {
    public menuItemName: string = '';
    public startOfDayUtcTimestamp: number = 0;
    public avgMenuItemPrice: number = 0;
    public avgOrderPrice: number = 0;
    public avgTicketPrice: number = 0;
    public serverSalesCount: Array<IServerOrderMenuItemCount> = [];
    public menuItemCount: number = 0;
    public ticketCount: number = 0;
    public orderCount: number = 0;

    public typeName = 'ReportOrderMenuItemDayAggItemDTO'
}

export interface IDepositInfo {
    creditBreakdown: { [name: string]: number };
    creditSubtotal: number;
    creditRefund: number;
    creditReceived: number,
    cashReceived: number;
    cashRefund: number;
    giftRedeemed: number;
    giftRefund: number;
    giftTip: number;
    giftCardAddViaCash: number;
    giftCardAddViaCard: number;
    tillOverShort: number;
    cashSubtotal: number;
    cashTip: number;
    creditTip: number;
    netDepositTotal: number;
}

export interface ITicketDensityInfo {
    timestamp: number;
    totalPrice: number;
}

export interface ITicketDayDensityBucket {
    timestamp: number;
    year: number;
    month: number;
    day: number;
    dayOfWeek: number;
    dayOfWeekLabel: string;
    totalPrice: number;
    ticketCount: number;
    avgTicketPrice: number;
}

export interface ITicketHourDensityBucket extends ITicketDayDensityBucket{
    hour: number;
}


export interface ITicketLiquorUsageInfo {
    id: string;
    parentId: string;
    serverName: string;
    status: string;
    liquorUsageList:Array<{ name: string, className: string, units: number }>;
    ticketTimestamp: number;
    orderTakenTimestamp: number;
}
