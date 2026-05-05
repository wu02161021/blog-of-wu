import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 20 })
  type: string;

  @Column({ length: 500 })
  content: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
