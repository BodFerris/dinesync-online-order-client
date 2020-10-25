import { DiscountSettingDTO } from './OrderDTO';

import { CourseDTO, OperationTimeDTO, OperationTimeExceptionDTO, PayPeriodType} from './RestaurantDTO';

export type DefaultTipMode = 'addTipLater' | 'defaultTip' | 'noTip' | '';

export class RestaurantOwnerSettingsDTO {
    public id: string = '';
    public parentId: string = '';
    public dineSyncEndpoint: string = '';
    public defaultDiscountNameList: Array<string> = [];
    public discountList: Array<DiscountSettingDTO> = [];
    public profitCentersList: Array<string> = [];
    public defaultReportEmail: string = '';

    public lastModified: number = 0;

    public typeName: string = 'RestaurantOwnerSettingsDTO';
}

export class RestaurantSiteSettingsDTO {
    public id: string = '';
    public parentId: string = '';
    public defaultSalesTax: number = 0;
    public isTipAllowed: boolean = true;
    public defaultTipMode: DefaultTipMode = '';
    public defaultTipRate: number = 0;

    // payment processor and gift end points
    public paymentProcessorEndpoint: string = '';
    public giftCardEndpoint: string = '';

    // gift cards
    public areGiftCardsUsed: boolean = false;
    public canGiftCardsBeSwiped: boolean = false;
    public canGiftCardsHaveManualEntry: boolean = false;
    public merchantNumber:string = '';
    public merchantKey: string = '';

    public isTableManagementUsed: boolean = false;

    public hasOnlineOrders: boolean = false;
    public isOnlineOrdersStopped: boolean = true;
    public onlineOrdersStoppedMessage: string = '';
    public onlineOrdersCloseTimeOffset: number = 0;

    public hasDelivery: boolean = false;
    public deliveryServiceType: 'Dinesync' | 'Restaurant' = 'Restaurant';
    public minimumOrderAmount: number = 0;
    public deliveryCloseTimeOffset: number = 0;
    public isDeliveryStopped: boolean = true;
    public deliveryStoppedMessage: string = '';

    public expectedFoodCompletionDuration: number = 0;
    public expectedDeliveryCompletionDuration: number = 0;

    public courseList: Array<CourseDTO> = [];
    public areAdhocModifiersAllowed: boolean = false;

    public doTicketsAutoClose: boolean = false;
    public defaultCreditSurchargeAmount: number = 0;

    public operationTimeList: Array<OperationTimeDTO> = [];
    public operationTimeExceptionList: Array<OperationTimeExceptionDTO> = [];
    public payPeriodType: PayPeriodType = '';
    public payPeriodUnitSkip: number = 0;
    public payPeriodData: string = '';

    public isEmployeeTimeTracked: boolean = false;
    public isSingleStationOnly: boolean = false;

    public isCustomerReceiptSalutationUsed: boolean = false;
    public customerReceiptSalutationText: string = '';

    public dinesyncPublicServiceEndpoint: string = '';
    public dinesyncApiKey: string = '';

    public lastModified: number = 0;

    public typeName: string = 'RestaurantSiteSettingsDTO'
}

export type ColorThemeType = 'Default' | 'Dark' | 'Light' | '';

export class PosDeviceSettingsDTO  {
    public id: string = '';
    public parentId: string = '';
    public posDeviceId: string = '';
    public deviceName: string = '';

    public isInQuickServiceMode: boolean = false;
    public areOrderButtonsCondensed: boolean = true;
    public isOrderGroupboxCollapsed: boolean = false;

    public isKitchenPrinterUsed: boolean = false;
    public kitchenPrinterLetterSpacing1: number = 0;
    public kitchenPrinterLetterSpacing2: number = 0;
    public kitchenIsSmallFontUsed: boolean = false;
    public kitchenIsImpactPrinterUsed: boolean = false;
    public isCustomerPrinterUsed: boolean = false;
    public isCustomerAutoPrintEnabled: boolean = false;
    public isAutoPrintDisabledForCash: boolean = false;
    public isMerchantReceiptConcise: boolean = false;
    public isTwoReceiptsPrinted: boolean = false;
    public customerPrinterLetterSpacing1: number = 0;
    public customerPrinterLetterSpacing2: number = 0;
    public customerPrinterIsSmallFontUsed: boolean = false;
    public customerPrinterIsImpactPrinterUsed: boolean = false;
    public kitchenPrinterName: string = '';
    public receiptPrinterName: string = '';

    public secondaryKitchenPrinterName: string = '';
    public secondarykitchenPrinterLetterSpacing1: number = 0;
    public secondarykitchenPrinterLetterSpacing2: number = 0;
    public secondaryKitchenIsSmallFontUsed: boolean = false;
    public secondaryKitchenIsImpactPrinterUsed: boolean = false;

    public barPrinterName: string = '';
    public barPrinterLetterSpacing1: number = 0;
    public barPrinterLetterSpacing2: number = 0;
    public barPrinterIsSmallFontUsed: boolean = false;
    public barPrinterIsImpactPrinterUsed: boolean = false;

    public doesDeviceUseTill: boolean = false;
    public isOpenTillOnLockscreen: boolean = false;
    public isSingleCustomerPayUsed: boolean = false;
    public customerDisplayName: string = '';
    public posOrderDisplayName: string = '';
    public paymentProcessorField1: string = '';
    public paymentProcessorField2: string = '';
    public isTokenRequestSent: boolean = false;
    public colorTheme: ColorThemeType = '';
    public startingOrderNumber = 100;
    public isInTimeSheetMode: boolean = false;
    public kitchenPrintIgnoreList: string = '';

    public scaleFactor: string = '';
    public isOrderUxHidden: boolean = false;
    public defaultMenuName: string = '';

    public isKitchenWarningMessageSuppressed: boolean = false;
    public isQuickServicePayMode: boolean = false;

    public lastModified: number = 0;

    public typeName: string = 'PosDeviceSettingsDTO';
}


// TODO: Deprecated.  The fully merged settings object is no longer used
//
// NOTE: This is only used to get the object graph of the DataObject.Settigns;
// Settings are a handled a bit differently then most DTO and DataObjects.
export class SettingsDTO {
    public id: string = '';
    public parentId: string = '';
    public posDeviceId: string = '';
    public deviceName: string = '';
    public isInTimeSheetMode: boolean = false;
    public isOrderGroupboxCollapsed: boolean = false;
    public isKitchenPrinterUsed: boolean = false;
    public kitchenPrinterLetterSpacing1: number = 0;
    public kitchenPrinterLetterSpacing2: number = 0;
    public kitchenIsSmallFontUsed: boolean = false;
    public kitchenIsImpactPrinterUsed: boolean = false;
    public isCustomerPrinterUsed: boolean = false;
    public isCustomerAutoPrintEnabled: boolean = false;
    public isAutoPrintDisabledForCash: boolean = false;
    public isMerchantReceiptConcise: boolean = false;
    public isTwoReceiptsPrinted: boolean = false;
    public customerPrinterLetterSpacing1: number = 0;
    public customerPrinterLetterSpacing2: number = 0;
    public customerPrinterIsSmallFontUsed: boolean = false;
    public customerPrinterIsImpactPrinterUsed: boolean = false;
    public kitchenPrinterName: string = '';
    public receiptPrinterName: string = '';

    public secondaryKitchenPrinterName: string = '';
    public secondarykitchenPrinterLetterSpacing1: number = 0;
    public secondarykitchenPrinterLetterSpacing2: number = 0;
    public secondaryKitchenIsSmallFontUsed: boolean = false;
    public secondaryKitchenIsImpactPrinterUsed: boolean = false;

    public barPrinterName: string = '';
    public barPrinterLetterSpacing1: number = 0;
    public barPrinterLetterSpacing2: number = 0;
    public barPrinterIsSmallFontUsed: boolean = false;
    public barPrinterIsImpactPrinterUsed: boolean = false;

    public doesDeviceUseTill: boolean = false;
    public isSingleCustomerPayUsed: boolean = false;
    public kitchenPrintIgnoreList: string = '';
    public paymentProcessorField1: string = '';
    public paymentProcessorField2: string = '';
    public colorTheme: ColorThemeType = '';
    public startingOrderNumber = 100;
    public defaultSalesTax: number = 0;
    public isTipAllowed: boolean = true;
    public defaultTipMode: string = '';
    public defaultTipRate: number = 0;

    public areGiftCardsUsed: boolean = false;
    public canGiftCardsBeSwiped: boolean = false;
    public canGiftCardsHaveManualEntry: boolean = false;
    public paymentProcessorEndpoint: string = '';
    public isTokenRequestSent: boolean = false;
    public giftCardEndpoint: string = '';

    public merchantNumber = '';
    public merchantKey = '';

    public isInQuickServiceMode = true;
    public areOrderButtonsCondensed: boolean = true;

    public isTableManagementUsed: boolean = false;

    public hasOnlineOrders: boolean = false;
    public isOnlineOrdersStopped: boolean = true;
    public onlineOrdersStoppedMessage: string = '';
    public onlineOrdersCloseTimeOffset: number = 0;

    public hasDelivery: boolean = false;
    public deliveryServiceType: 'DineSync' | 'Restaurant' = 'Restaurant';
    public minimumOrderAmount: number = 0;
    public deliveryCloseTimeOffset: number = 0;
    public isDeliveryStopped: boolean = true;
    public deliveryStoppedMessage: string = '';

    public expectedFoodCompletionDuration: number = 0;
    public expectedDeliveryCompletionDuration: number = 0;

    public courseList: Array<CourseDTO> = [];
    public areAdhocModifiersAllowed = false;
    public doTicketsAutoClose: boolean = false;
    public defaultCreditSurchargeAmount: number = 0;
    public operationTimeList: Array<OperationTimeDTO> = [];
    public operationTimeExceptionList: Array<OperationTimeExceptionDTO> = [];
    public payPeriodType: PayPeriodType = '';
    public payPeriodUnitSkip: number = 0;
    public payPeriodData: string = '';

    public isEmployeeTimeTracked: boolean = false;
    public isSingleStationOnly: boolean = false;

    public isCustomerReceiptSalutationUsed: boolean = false;
    public customerReceiptSalutationText: string = '';

    public dineSyncEndpoint: string = '';
    public defaultReportEmail: string = '';
    public defaultDiscountNameList: Array<string> = [];
    public discountList: Array<DiscountSettingDTO> = [];
    public profitCentersList: Array<string> = [];

    public scaleFactor: string = '';
    public isOrderUxHidden: boolean = false;
    public defaultMenuName: string = '';

    public isKitchenWarningMessageSuppressed: boolean = false;
    public isQuickServicePayMode: boolean = false;

    public dinesyncPublicServiceEndpoint: string = '';
    public dinesyncApiKey: string = '';

    public typeName: string = 'SettingsDTO';
}
