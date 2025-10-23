import { IsString, IsNotEmpty } from 'class-validator';

export class UpdatePropertyStatusDto {
  @IsString()
  @IsNotEmpty()
  status: string;
}
