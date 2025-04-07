import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { GroupOrdersDto } from 'src/orders/dtos/group.dto';
import { RouteOrdersDto } from 'src/orders/dtos/route.dto';

import { GroupOrdersResponseDto, RouteOrdersResponseDto } from './python-api.dto';

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
  async routeOrders(routeOrders: RouteOrdersDto): Promise<RouteOrdersResponseDto> {
    try {
      const { data } = await axios.post(`${this.baseUrl}/route-orders`, routeOrders, {
        timeout: 10000,
      });
      return data as RouteOrdersResponseDto;
    } catch (error: any) {
      const response = error.response;

      if (response?.data?.code === 'NOT_SAME_DORMITORY') {
        throw new BadRequestException(response.data.message);
      }

      console.error('Python server error:', response?.data || error.message);

      throw new InternalServerErrorException(
        response?.data?.message || 'Lỗi khi gọi server điều hướng đơn hàng'
      );
    }
  }
}
