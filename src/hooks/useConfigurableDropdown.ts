import { useDropdownOptions } from './useDropdownOptions';

export interface ConfigurableOption {
  value: string;
  label: string;
  key: string;
}

export const useConfigurableDropdown = (category: string) => {
  const { options, loading } = useDropdownOptions(category);

  const configurableOptions: ConfigurableOption[] = options.map(option => ({
    value: option.option_value,
    label: option.display_name,
    key: option.option_key
  }));

  return {
    options: configurableOptions,
    loading,
    isEmpty: configurableOptions.length === 0
  };
};