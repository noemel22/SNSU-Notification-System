import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database/config';

export interface MediaAttributes {
    id: number;
    data: string;
    mimeType: string;
    filename: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface MediaCreationAttributes extends Optional<MediaAttributes, 'id'> { }

class Media extends Model<MediaAttributes, MediaCreationAttributes> implements MediaAttributes {
    public id!: number;
    public data!: string;
    public mimeType!: string;
    public filename!: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Media.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        data: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        mimeType: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        filename: {
            type: DataTypes.STRING(255),
            allowNull: false
        }
    },
    {
        sequelize,
        tableName: 'media',
        timestamps: true
    }
);

export default Media;
