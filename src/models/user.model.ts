import { ApiProperty } from '@nestjs/swagger';

export class User {
  @ApiProperty({ example: '123456789', description: 'Id of user', required: true })
  _id: string;
  @ApiProperty({ example: 'Nguyen', description: 'First name of user', required: true })
  firstName: string;
  @ApiProperty({ example: 'A', description: 'Last name of users', required: true })
  lastName: string;
  @ApiProperty({example: '123@gmail.com', description: 'Email of user', required: true})
  email: string;
  @ApiProperty({ example: '123456', description: 'Password of user', required: true })
  password: string;
  @ApiProperty({ example: '2021-01-01T00:00:00.000Z', description: 'Created date of user', required: true })
  createdAt: Date;
}