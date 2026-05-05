import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 120 })
  email: string;

  @Column({ length: 80 })
  name: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string;

  @Column({ type: 'varchar', length: 24, default: 'member' })
  role: string;

  @Column({ name: 'approval_status', type: 'varchar', length: 16, default: 'pending' })
  approvalStatus: 'pending' | 'approved' | 'rejected';

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt: Date | null;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy: string | null;

  @Column({ name: 'approval_note', type: 'varchar', length: 255, nullable: true })
  approvalNote: string | null;

  @Column({ name: 'login_count', type: 'int', default: 0 })
  loginCount: number;

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt: Date | null;

  @Column({ name: 'theme_preference', type: 'varchar', length: 10, default: 'dark' })
  themePreference: 'dark' | 'light';

  @Column({ name: 'failed_attempts', default: 0 })
  failedAttempts: number;

  @Column({ name: 'locked_until', type: 'timestamp', nullable: true })
  lockedUntil: Date | null;

  @Column({ name: 'reset_token', type: 'varchar', length: 128, nullable: true })
  resetToken: string | null;

  @Column({ name: 'reset_token_expires_at', type: 'timestamp', nullable: true })
  resetTokenExpiresAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
