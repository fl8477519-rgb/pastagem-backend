export interface Farm {
  id: string;
  name: string;
  ownerName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Paddock {
  id: string;
  farmId: string;
  name: string;
  areaHectares: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFarmInput {
  name: string;
  ownerName: string;
}

export interface CreatePaddockInput {
  farmId: string;
  name: string;
  areaHectares: number;
}
