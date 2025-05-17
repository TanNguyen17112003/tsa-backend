import { Test, TestingModule } from '@nestjs/testing';

import { FirebaseServiceImpl } from './firebase.service.impl';

describe('FirebaseServiceImpl', () => {
  let service: FirebaseServiceImpl;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FirebaseServiceImpl],
    }).compile();

    service = module.get<FirebaseServiceImpl>(FirebaseServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
