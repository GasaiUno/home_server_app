export type ServiceItem = {
  name: string;
  url: string;
  description: string;
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
