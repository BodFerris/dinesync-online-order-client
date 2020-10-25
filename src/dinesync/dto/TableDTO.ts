
export interface ITable {
    id: string;
    parentId: string;
    name: string;
    occupancy: number;
    statusChangeTime: number;
    status: string;
    displayId: string;
    tableType: string;
    typeName: string;
}

export class TableDTO implements ITable {
    public id: string = '';
    public parentId: string = '';
    public name: string = '';
    public occupancy: number = 0;
    public statusChangeTime: number = 0;
    public displayId: string = '';
    public status = '';
    public tableType: string = '';

    public typeName: string = 'TableDTO';
}

