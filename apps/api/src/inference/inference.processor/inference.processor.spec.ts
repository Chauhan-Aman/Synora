import { Test, TestingModule } from '@nestjs/testing';
import { InferenceProcessor } from './inference.processor';

describe('InferenceProcessor', () => {
  let provider: InferenceProcessor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InferenceProcessor],
    }).compile();

    provider = module.get<InferenceProcessor>(InferenceProcessor);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
