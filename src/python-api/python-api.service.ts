import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { GroupOrdersDto } from 'src/orders/dtos/group.dto';

import { GroupOrdersResponseDto } from './python-api.dto';

@Injectable()
export class PythonApiService {
  private baseUrl: string;
  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('GROUP_ORDER_URL', '');
  }

  async groupOrders(groupOrdersDto: GroupOrdersDto): Promise<GroupOrdersResponseDto> {
    try {
      const { data } = await axios.post(`${this.baseUrl}/group-orders`, groupOrdersDto, {
        timeout: 10000,
      });
      return data as GroupOrdersResponseDto;
    } catch (error: any) {
      const response = error.response;

      if (response?.data?.code === 'NO_ORDERS') {
        throw new BadRequestException(response.data.message);
      }

      console.error('Python server error:', response?.data || error.message);

      throw new InternalServerErrorException(
        response?.data?.message || 'Lỗi khi gọi server gom đơn hàng'
      );
    }
  }
}
