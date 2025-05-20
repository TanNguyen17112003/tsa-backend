import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: false })
class IsDeliveryTimeSlotConstraint implements ValidatorConstraintInterface {
  validate(time: any, _args: ValidationArguments) {
    if (typeof time !== 'string') return false;
    return (
      /^\d{2}:\d{2}$/.test(time) &&
      (() => {
        const [h, m] = time.split(':').map(Number);
        return h >= 0 && h < 24 && m >= 0 && m < 60;
      })()
    );
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} phải đúng định dạng HH:mm`;
  }
}

export function IsDeliveryTimeSlot(validationOptions?: ValidationOptions) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsDeliveryTimeSlotConstraint,
    });
  };
}
