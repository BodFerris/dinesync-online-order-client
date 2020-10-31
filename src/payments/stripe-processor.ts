import { StringUtility } from '@/next-ux2/utility';

declare var google: any;

const allowedCardNetworks = ["AMEX", "DISCOVER", "INTERAC", "JCB", "MASTERCARD", "VISA"];
const allowedCardAuthMethods = ["PAN_ONLY", "CRYPTOGRAM_3DS"];

interface IPaymentAllowedInfo {
    type: string;

    parameters: {
        allowedAuthMethods: Array<string>;
        allowedCardNetworks: Array<string>;
    }
}

interface ITokenizationSpecification {
    type: string;
    parameters: {[key: string]: string};
}

interface IMerchantInfo {
    merchantName: string;
}

interface ITransactionInfo {
    totalPriceStatus: string;
    totalPrice: string;
    currencyCode: string;
    countryCode: string;
}

interface IPaymentRequestPayload {
    apiVersion: number;
    apiVersionMinor: number;
    transactionInfo: ITransactionInfo;
    merchantInfo: IMerchantInfo;
    tokenizationSpecification: ITokenizationSpecification;
    allowedPaymentMethods: Array<IPaymentAllowedInfo>;
}

interface IPaymentStatusPayload {
    apiVersion: number;
    apiVersionMinor: number;
    allowedPaymentMethods: Array<IPaymentAllowedInfo>
}

function createPayConnectionTestMessage(): IPaymentStatusPayload {
    return {
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [{
            type: 'CARD',
            parameters: {
                allowedAuthMethods: allowedCardAuthMethods,
                allowedCardNetworks: allowedCardNetworks
            }
        }]
    }
}

export function createPaymentRequestPayload(amount :number): IPaymentRequestPayload {
    let amountText = StringUtility.toPriceText(amount);
    let returnValue ={
        apiVersion: 2,
        apiVersionMinor: 0,

        transactionInfo: {
            totalPriceStatus: 'FINAL',
            totalPrice: amountText,
            currencyCode: 'USD',
            countryCode: 'US'
        },

        merchantInfo: {
            merchantName: 'Dineysnc Inc.'
        },

        tokenizationSpecification: {
            type: 'PAYMENT_GATEWAY',
            parameters: {
                'gateway': 'stripe',
                "stripe:version": "2018-10-31",
                "stripe:publishableKey": "pk_test_pErJdQLLVM4ivblGGn0vscMu00r8aGdkxW"
            }
        },

        allowedPaymentMethods: [{
            type: 'CARD',
            parameters: {
                allowedAuthMethods: allowedCardAuthMethods,
                allowedCardNetworks: allowedCardNetworks
            }
        }]
    } as IPaymentRequestPayload;

    return returnValue;
}

var paymentClient: any;

export async function loadGpayScript(): Promise<{statusMessage: string, paymentClient:any }> {
    return new Promise((accept) => {
        if ((window as any)['google'] && (window as any).google.payments) {
            // library has not loaded yet, so load it
            return {
                statusMessage: 'already loaded',
                paymentClient: paymentClient
            }
        }
        else {
            let scriptElement = document.createElement('script');
            scriptElement.setAttribute('async', 'async');
            
            scriptElement.onload = async () => {
                try {
                    let paymentStatusPayload = createPayConnectionTestMessage();
                    paymentClient = new google.payments.api.PaymentsClient({environment: 'TEST'});
                    let response = await paymentClient.isReadyToPay(paymentStatusPayload);
                    if (response.result) {
                        accept({
                            statusMessage: '',
                            paymentClient: paymentClient
                        })
                    }
                    else {
                        let errorMessage = (response) ? JSON.stringify(response) : 'unknown error';
                        accept({
                            statusMessage: 'pay script loaded but failed when creating pay object and checking status: ' + errorMessage,
                            paymentClient: null
                        })
                    }
                }
                catch (errorInfo) {
                    accept({
                        statusMessage: 'exception while loading pay script and checking status: ' + errorInfo?.message,
                        paymentClient: null
                    })
                }
            };

            scriptElement.onerror = (errorMessage) => {
                accept({
                    statusMessage: 'error while trying to load script src: ' + errorMessage,
                    paymentClient: null
                });
            };

            scriptElement.setAttribute('src', 'https://pay.google.com/gp/p/js/pay.js');
    
            document.head.appendChild(scriptElement);
        }
    })

}