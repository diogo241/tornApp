'use client';

import { Check, ChevronsUpDown } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface FormRelationSelectProps {
  name: string;
  label: string;
  placeholder?: string;
  emptyMessage?: string;
  options: { label: string; value: string | number }[] | undefined;
  className?: string;
}

export function FormRelationSelect({
  name,
  label,
  placeholder = 'Select option...',
  emptyMessage = 'No option found.',
  options,
  className,
}: FormRelationSelectProps) {
  const { control, setValue } = useFormContext();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn('flex flex-col', className)}>
          <FormLabel>{label}</FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  role="combobox"
                  className={cn(
                    'w-full justify-between',
                    !field.value && 'text-muted-foreground',
                  )}
                >
                  {field.value
                    ? options?.find((option) => option.value === field.value)
                        ?.label
                    : placeholder}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput
                  placeholder={`Search ${label.toLowerCase()}...`}
                />
                <CommandList>
                  <CommandEmpty>{emptyMessage}</CommandEmpty>
                  <CommandGroup>
                    {options?.map((option) => (
                      <CommandItem
                        key={option.value}
                        value={option.label}
                        onSelect={() => {
                          setValue(name, option.value, {
                            shouldValidate: true,
                          });
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            option.value === field.value
                              ? 'opacity-100'
                              : 'opacity-0',
                          )}
                        />
                        {option.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
