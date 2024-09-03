import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Request,
  Response,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateSampleDto } from 'src/dto/sample.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { SampleService } from 'src/services/sample.service';

@ApiBearerAuth('JWT-auth')
@ApiTags('Sample')
@Controller('/api/sample')
export class SampleController {
  constructor(private readonly sampleServerice: SampleService) {}
  @UseGuards(AuthGuard)
  @Post()
  @ApiOperation({ summary: 'Create sample' })
  @ApiResponse({ status: 201, description: 'OK.' })
  async createSample(@Response() response, @Request() request, @Body() body: CreateSampleDto) {
    const sample = await this.sampleServerice.create(body);
    return response.status(HttpStatus.CREATED).json({
      sample,
    });
  }

  @UseGuards(AuthGuard)
  @Get('/:id')
  @ApiOperation({ summary: 'Get sample by id' })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'id of sample',
    schema: { oneOf: [{ type: 'string' }, { type: 'integer' }] },
  })
  @ApiResponse({ status: 200, description: 'OK.' })
  async getSample(@Response() response, @Request() request, @Param() params) {
    const sample = await this.sampleServerice.getById(params);
    return response.status(HttpStatus.OK).json({
      sample,
    });
  }

  @UseGuards(AuthGuard)
  @Get()
  @ApiOperation({ summary: 'Get all sample' })
  @ApiResponse({ status: 200, description: 'OK.' })
  async getAll(@Response() response, @Request() _request) {
    const sample = await this.sampleServerice.getAll();
    return response.status(HttpStatus.OK).json({
      sample,
    });
  }

  @UseGuards(AuthGuard)
  @Put('/:id')
  @ApiParam({
    name: 'id',
    required: true,
    description: 'id of sample',
    schema: { oneOf: [{ type: 'string' }, { type: 'integer' }] },
  })
  @ApiOperation({ summary: 'Update a sample' })
  @ApiResponse({ status: 200, description: 'OK.' })
  async updateSample(
    @Response() response,
    @Request() request,
    @Param() params,
    @Body() Body: CreateSampleDto
  ) {
    const sample = await this.sampleServerice.update(params, Body);
    return response.status(HttpStatus.OK).json({
      sample,
    });
  }

  @UseGuards(AuthGuard)
  @Delete('/:id')
  @ApiParam({
    name: 'id',
    required: true,
    description: 'id of sample',
    schema: { oneOf: [{ type: 'string' }, { type: 'integer' }] },
  })
  @ApiOperation({ summary: 'Delete a sample' })
  @ApiResponse({ status: 200, description: 'OK.' })
  async deleteSample(@Response() response, @Request() request, @Param() params) {
    await this.sampleServerice.delete(params);
    return response.status(HttpStatus.OK).json({
      message: 'Sample deleted successfully test',
    });
  }
}
