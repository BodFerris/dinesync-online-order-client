import { StringUtility } from '@/next-ux2/utility';

export async function createPaymentIntent(amount: number, orderId: string, ticketId: string): Promise<string> {
    let formData = new FormData();
    formData.append('amount', StringUtility.toPriceText(amount));
    formData.append('orderId', orderId);
    formData.append('ticketId', ticketId);

    //let baseUrl = 'localhost:44354';
    let baseUrl = 'seattleservice.dinesync.com';
    let endpoint = `https://${baseUrl}/api/Payment/CreatePaymentIntent`;
    let result = await fetch(endpoint, {
        method: 'POST',
        cache: 'reload',
        body: formData
    });

    if (result.ok) {
        return await result.text()
    }
    else {
        let errorMessage = result.statusText;
        if (StringUtility.isNullOrEmpty(errorMessage)) {
            errorMessage = 'Could not validate the order request.  Please try again.';
        }
        throw new Error(errorMessage);
    }

}
