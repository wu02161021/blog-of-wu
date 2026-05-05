import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('auth_operation_logs')
export class AuthOperationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 40 })
  action: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  detail: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
