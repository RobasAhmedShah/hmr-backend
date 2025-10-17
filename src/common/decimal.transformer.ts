import { ValueTransformer } from 'typeorm';
import Decimal from 'decimal.js';

export const DecimalTransformer: ValueTransformer = {
  to: (value?: Decimal | number | string | null) =>
    value !== undefined && value !== null ? new Decimal(value).toString() : null,
  from: (value: string | null) => (value !== null ? new Decimal(value) : null),
};

export type Decimalish = Decimal | string | number;


