import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database/config';

export interface NotificationAttributes {
  id: number;
  title: string;
  content: string;
  type: 'info' | 'event' | 'emergency' | 'success' | 'warning';
  imagePath?: string;
  thumbnailPath?: string;
  eventDate?: Date;
  timestamp: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface NotificationCreationAttributes extends Optional<NotificationAttributes, 'id' | 'imagePath' | 'thumbnailPath' | 'timestamp'> { }

class Notification extends Model<NotificationAttributes, NotificationCreationAttributes> implements NotificationAttributes {
  public id!: number;
  public title!: string;
  public content!: string;
  public type!: 'info' | 'event' | 'emergency' | 'success' | 'warning';
  public imagePath?: string;
  public thumbnailPath?: string;
  public eventDate?: Date;
  public timestamp!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Notification.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('info', 'event', 'emergency', 'success', 'warning'),
      allowNull: false,
      defaultValue: 'info'
    },
    imagePath: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    thumbnailPath: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    eventDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'notifications',
    timestamps: true
  }
);

export default Notification;
