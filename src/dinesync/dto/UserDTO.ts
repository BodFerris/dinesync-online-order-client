
export class UserDTO {
    public id: string = '';
    public parentId: string = '';
    public accountName: string = '';
    public passwordHash: string = '';
    public pin: string = '';
    public resetPin: boolean = false;
    public isPasswordChangedAtLogin: boolean = false;
    public profilePicUri: string = '';
    public isSystemAccount: boolean = false;
    public firstName: string = '';
    public lastName: string = '';
    public isClockedIn: boolean = false;

    public cannotEditOwnTimeSheet: boolean = false;

    public canEditOtherTickets: boolean = false;
    public canTransferTickets: boolean = false;
    public hasaAccessToMenuEditor: boolean = false;
    public hasAccessToTill: boolean = false;
    public hasAccessToReports: boolean = false;
    public hasAccessToWebsite: boolean = false;
    public hasAccessToRefunds: boolean = false;
    public canCustomizeDiscounts: boolean = false;
    public hasAccessToUserProfileSettings: boolean = false;
    public canEditTableLayout: boolean = false;
    public canEditOtherTimeSheets: boolean = false;
    public hasAccessToSecuritySettings: boolean = false;
    public canEditInactiveMenu: boolean = false;

    public lastModified: number= 0;
    public typeName: string = 'UserDTO';
}

