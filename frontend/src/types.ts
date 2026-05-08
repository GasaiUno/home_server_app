export type ServiceItem = {
  id: string;
  name: string;
  url: string;
  description: string;
  icon: string;
  accent: string;
  category: string;
};

export type StatusResponse = {
  status: string;
  app: string;
  version: string;
  uptime_seconds: number;
  server_time: string;
};

export type ServicesResponse = {
  services: ServiceItem[];
};

export type Notice = {
  type: "success" | "error";
  message: string;
};

export type ServiceTarget = "_self" | "_blank";
