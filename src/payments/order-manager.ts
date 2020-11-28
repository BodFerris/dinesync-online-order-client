import { IConfig } from '@/common/IConfig';
import { OrderDTO } from '@/dinesync/dto/OrderDTO';
import { StringUtility } from '@/next-ux2/utility';

declare var AppConfig: IConfig;

export class OrderManager {
    static async validateOrder(order: OrderDTO) {
        // public async Task<IActionResult> ValidateOnlineOrder([FromForm] string restaurantId, [FromForm] string orderJsonText)
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
                returnValue = 'Error occured when trying to validate the order with the restaurant.';
            }

            return returnValue;
        }
    }
}