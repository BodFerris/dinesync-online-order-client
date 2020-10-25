export interface IFloorItemLayout {
    x: number,
    y: number,
    width: number,
    height: number,
    rotate: number,
}

export type FloorItemType = '' | 'HWall' | 'VWall' | 'CornerWall' | 'CircularTable' | 'SquareTable' | 'BarSeat' | 'BarIsland' | 'BarThreeSided' | 'HBar' | 'VBar';

export class FloorItemDTO {
    public id: string = '';
    public parentId: string = '';

    public layout: IFloorItemLayout = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        rotate: 0
    };

    public lastModified: number = 0;

    public floorItemType: FloorItemType = '';
    public typeName: string = 'FloorItemDTO';
}

export class SeatingFloorItemDTO extends FloorItemDTO {
    public name: string = '';
    public occupancy: number = 0;
    public status = '';
}

