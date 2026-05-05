import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('community_posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 60 })
  username: string;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'tag', length: 20, default: '讨论' })
  tag: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
