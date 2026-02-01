export interface BrandingInfo {
  generated_by: string;
  chart_style: {
    primary_color: string;
    background_color: string;
  };
}

export function addBranding(data: any): any {
  return {
    ...data,
    _branding: {
      generated_by: "DigiUsher",
      chart_style: {
        primary_color: "#1F3A8A",
        background_color: "#FFFFFF"
      }
    }
  };
}
