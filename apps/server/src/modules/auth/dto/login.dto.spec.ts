import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { LoginDto } from './login.dto';
import { CreateProductDto } from '../../products/dto/product.dto';

async function errorsOf(instance: any): Promise<number> {
  const errors = await validate(instance);
  return errors.length;
}

describe('LoginDto', () => {
  it('合法输入通过校验', async () => {
    const dto = plainToInstance(LoginDto, { username: 'admin', password: 'secret' });
    expect(await errorsOf(dto)).toBe(0);
  });

  it('缺少用户名校验失败', async () => {
    const dto = plainToInstance(LoginDto, { password: 'secret' });
    expect(await errorsOf(dto)).toBeGreaterThan(0);
  });

  it('空密码校验失败', async () => {
    const dto = plainToInstance(LoginDto, { username: 'admin', password: '' });
    expect(await errorsOf(dto)).toBeGreaterThan(0);
  });
});

describe('CreateProductDto', () => {
  it('缺少 name 校验失败', async () => {
    const dto = plainToInstance(CreateProductDto, { slug: 'no-name' });
    expect(await errorsOf(dto)).toBeGreaterThan(0);
  });

  it('非法 status 校验失败', async () => {
    const dto = plainToInstance(CreateProductDto, { name: 'X', status: 'invalid' });
    expect(await errorsOf(dto)).toBeGreaterThan(0);
  });

  it('合法输入通过校验', async () => {
    const dto = plainToInstance(CreateProductDto, { name: 'HytTUI', status: 'published' });
    expect(await errorsOf(dto)).toBe(0);
  });
});
