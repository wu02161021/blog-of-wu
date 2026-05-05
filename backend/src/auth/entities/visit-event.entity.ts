import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('visit_events')
export class VisitEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'visitor_id', type: 'varchar', length: 64 })
  visitorId: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Index()
  @Column({ name: 'event_type', type: 'varchar', length: 24 })
  eventType: 'SITE_ENTER' | 'ROUTE_VIEW' | 'LOGIN' | 'REGISTER' | 'LOGOUT';

  @Column({ name: 'route_path', type: 'varchar', length: 255, nullable: true })
  routePath: string | null;

  @Column({ name: 'device_type', type: 'varchar', length: 20, nullable: true })
  deviceType: string | null;

  @Column({ name: 'browser_name', type: 'varchar', length: 32, nullable: true })
  browserName: string | null;

  @Column({ name: 'source', type: 'varchar', length: 80, nullable: true })
  source: string | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 64, nullable: true })
  ipAddress: string | null;

  @Column({ name: 'region', type: 'varchar', length: 80, nullable: true })
  region: string | null;

  @Column({ name: 'duration_seconds', type: 'int', default: 0 })
  durationSeconds: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
