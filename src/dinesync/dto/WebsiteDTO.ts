
export class Hours {
    public id: string = '';
    public parentId: string = '';
    public days: string = '';
    public hours: string = '';
    public position: number = 0;
    public typeName: string = 'HoursDTO';
}

export class GalleryImage {
    public id: string = '';
    public parentId: string = '';
    public name: string = '';
    public uri: string = '';
    public sortIndex: number = 0;
    public typeName: string = 'GalleryImageDTO';
}

export class WebsiteInfoDTO {
    public id: string = '';
    public parentId: string = '';
    public restaurantName: string = '';
    public address: string = '';
    public phoneNumber: string = '';
    public description: string = '';
    public menuLayoutType: string = '';
    public hoursList: Array<Hours> = new Array<Hours>();
    public galleryImageList: Array<GalleryImage> = new Array<GalleryImage>();
    public lastModified = 0;
    public typeName: string = 'WebsiteInfoDTO';
}
