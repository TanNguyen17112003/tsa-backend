import { GroupOrdersDto } from 'src/orders/dtos/group.dto';
import { RouteOrdersDto } from 'src/orders/dtos/route.dto';

import { GroupOrdersResponseDto, RouteOrdersResponseDto } from './python-api.dto';

export abstract class PythonApiService {
  abstract groupOrders(groupOrdersDto: GroupOrdersDto): Promise<GroupOrdersResponseDto>;
  abstract routeOrders(routeOrders: RouteOrdersDto): Promise<RouteOrdersResponseDto>;
}
