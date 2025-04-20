import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

export function IsNotBlank(validationOptions?: ValidationOptions) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isNotBlank',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: {
        message: (args: ValidationArguments) => `${args.property} không được để trống`,
        ...validationOptions,
      },
      validator: {
        validate(value: any, _args: ValidationArguments) {
          return typeof value === 'string' && value.trim().length > 0;
        },
      },
    });
  };
}
