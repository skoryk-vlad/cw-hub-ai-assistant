import { OpenAiModel } from '../config/openai.config.js';

export interface IModelUsage {
  input: number;
  cached: number;
  output: number;
}

const pricingByModel: { [key in OpenAiModel]: IModelUsage } = {
  [OpenAiModel.GPT_4O_MINI]: {
    input: 0.15,
    cached: 0.075,
    output: 0.6,
  },
  [OpenAiModel.GPT_5_MINI]: {
    input: 0.25,
    cached: 0.025,
    output: 2,
  },
  [OpenAiModel.GPT_5]: {
    input: 1.25,
    cached: 0.125,
    output: 10,
  },
  [OpenAiModel.GPT_5_1]: {
    input: 1.25,
    cached: 0.125,
    output: 10,
  },
};

const calc = (pricePerMil: number, usedTokens: number) =>
  (pricePerMil / 1000000) * usedTokens;

export const estimatePrice = (
  usage: IModelUsage,
  model: OpenAiModel,
): number => {
  const pricing = pricingByModel[model];

  return (
    calc(pricing.input, usage.input) +
    calc(pricing.cached, usage.cached) +
    calc(pricing.output, usage.output)
  );
};
