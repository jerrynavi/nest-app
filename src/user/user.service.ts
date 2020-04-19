import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) { }

  public async findUser(username: string): Promise<User> {
    try {
      return this.users.findOne({
        username,
      });
    } catch (error) {
      throw new BadRequestException(error.message || error);
    }
  }

  public async addUser(user: User): Promise<User> {
    try {
      const newUser = await this.users.save(user);
      return newUser;
    } catch (error) {
      throw new BadRequestException(error.message || error);
    }
  }

  public getAllUsers(): Promise<User[]> {
    try {
      return this.users.find();
    } catch (error) {
      throw new BadRequestException(error.message || error);
    }
  }
}