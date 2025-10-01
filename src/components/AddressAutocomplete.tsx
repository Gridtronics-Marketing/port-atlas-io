import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSystemConfigurations } from "@/hooks/useSystemConfigurations";
import { Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";

interface AddressComponents {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  fullAddress: string;
}

interface AddressAutocompleteProps {
  label: string;
  value: string;
  onChange: (address: string) => void;
  onAddressSelect?: (components: AddressComponents) => void;
  placeholder?: string;
  required?: boolean;
}

export const AddressAutocomplete = ({
  label,
  value,
  onChange,
  onAddressSelect,
  placeholder = "Start typing an address...",
  required = false,
}: AddressAutocompleteProps) => {
  const { configurations } = useSystemConfigurations("external_apis");
  const [isLoading, setIsLoading] = useState(false);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const placesApiKey = configurations.find(
    (config) => config.key === "google_places_api_key" && config.is_active
  )?.value;

  useEffect(() => {
    if (placesApiKey && window.google?.maps?.places) {
      autocompleteService.current = new google.maps.places.AutocompleteService();
      const div = document.createElement("div");
      placesService.current = new google.maps.places.PlacesService(div);
    }
  }, [placesApiKey]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowPredictions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    if (!newValue.trim() || !autocompleteService.current) {
      setPredictions([]);
      setShowPredictions(false);
      return;
    }

    setIsLoading(true);
    autocompleteService.current.getPlacePredictions(
      { input: newValue },
      (results, status) => {
        setIsLoading(false);
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          setPredictions(results);
          setShowPredictions(true);
        } else {
          setPredictions([]);
          setShowPredictions(false);
        }
      }
    );
  };

  const extractAddressComponents = (place: google.maps.places.PlaceResult): AddressComponents => {
    const components = place.address_components || [];
    let street = "";
    let city = "";
    let state = "";
    let zip = "";
    let country = "";

    components.forEach((component) => {
      const types = component.types;
      if (types.includes("street_number")) {
        street = component.long_name + " ";
      }
      if (types.includes("route")) {
        street += component.long_name;
      }
      if (types.includes("locality")) {
        city = component.long_name;
      }
      if (types.includes("administrative_area_level_1")) {
        state = component.short_name;
      }
      if (types.includes("postal_code")) {
        zip = component.long_name;
      }
      if (types.includes("country")) {
        country = component.long_name;
      }
    });

    return {
      street: street.trim(),
      city,
      state,
      zip,
      country,
      fullAddress: place.formatted_address || value,
    };
  };

  const handlePredictionClick = (prediction: any) => {
    if (!placesService.current) return;

    setIsLoading(true);
    placesService.current.getDetails(
      { placeId: prediction.place_id },
      (place, status) => {
        setIsLoading(false);
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          const components = extractAddressComponents(place);
          onChange(components.fullAddress);
          onAddressSelect?.(components);
          setShowPredictions(false);
        } else {
          toast.error("Failed to get address details");
        }
      }
    );
  };

  if (!placesApiKey) {
    return (
      <div className="space-y-2">
        <Label htmlFor={label}>{label}</Label>
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2" ref={wrapperRef}>
      <Label htmlFor={label}>{label}</Label>
      <div className="relative">
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={value}
            onChange={handleInputChange}
            onFocus={() => predictions.length > 0 && setShowPredictions(true)}
            placeholder={placeholder}
            required={required}
            className="pl-10"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        
        {showPredictions && predictions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
            {predictions.map((prediction) => (
              <button
                key={prediction.place_id}
                type="button"
                onClick={() => handlePredictionClick(prediction)}
                className="w-full text-left px-4 py-2 hover:bg-accent transition-colors flex items-start gap-2"
              >
                <MapPin className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {prediction.structured_formatting.main_text}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {prediction.structured_formatting.secondary_text}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
