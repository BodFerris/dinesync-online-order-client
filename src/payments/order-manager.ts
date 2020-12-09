import { IConfig } from '@/common/IConfig';
import { IOnlineTransactionInfo, IOnlineValidationResult, OrderDTO } from '@/dinesync/dto/OrderDTO';
import { StringUtility } from '@/next-ux2/utility';

declare var AppConfig: IConfig;

export class OrderManager {
    static async validateOrder(order: OrderDTO): Promise<IOnlineValidationResult> {
        let formData = new FormData();
        formData.append('restaurantId', order.parentId);
        formData.append('orderJsonText', JSON.stringify(order));

        let baseUrl = AppConfig.dinesyncEndpoint;
        let endpoint = `${baseUrl}/api/RestaurantClient/ValidateOnlineOrder`;
        let result = await fetch(endpoint, {
            method: 'POST',
            cache: 'reload',
            body: formData
        });
    
        if (result.ok) {
            let onlineValidationResultJsonText = await result.text();
            return JSON.parse(onlineValidationResultJsonText)
        }
        else {
            let failureReason = '';

            try { 
                failureReason = await result.text();
            }
            catch (errorInfo) {
                // swallow error
            }

            if (StringUtility.isNullOrEmpty(failureReason)) {
                failureReason = 'Error occured when trying to validate the order with the restaurant.';
            }

            return {
                isValid: false,
                failureReason: failureReason,
            } as IOnlineValidationResult;
        }
    }

    static async captureOrder(order: OrderDTO, transactionInfo: IOnlineTransactionInfo, orderSignature: string, deviceId: string) {
        let formData = new FormData();
        formData.append('restaurantId', order.parentId);
        formData.append('deviceId', deviceId);
        formData.append('signature', orderSignature);
        formData.append('orderJsonText', JSON.stringify(order));
        formData.append('transactionInfoJsonText', JSON.stringify(transactionInfo));

        let baseUrl = AppConfig.dinesyncEndpoint;
        let endpoint = `${baseUrl}/api/RestaurantClient/CaptureOnlineOrder`;
        let result = await fetch(endpoint, {
            method: 'POST',
            cache: 'reload',
            body: formData
        });
    
        if (result.ok) {
            return '';
        }
        else {
            let returnValue = '';

            try { 
                returnValue = await result.text();
            }
            catch (errorInfo) {
                // swallow error
            }

            if (StringUtility.isNullOrEmpty(returnValue)) {
                returnValue = 'Error occured while sending order to restaurant.';
            }

            return returnValue;
        }
    }
}