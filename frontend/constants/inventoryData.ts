// example data for warehouse content

export type Item = {
  name: string;
  count: number;
};

export type Warehouse = {
  id: string;
  name: string;
  items: Item[];
};

export const WAREHOUSES: Warehouse[] = [
  {
    id: "1",
    name: "Main Warehouse",
    items: [
      { name: "PVC Pipe (10ft)", count: 42 },
      { name: "Copper Wire (spool)", count: 15 },
      { name: "Junction Box", count: 28 },
      { name: "Conduit Connector", count: 60 },
    ],
  },
  {
    id: "2",
    name: "East Storage",
    items: [
      { name: "Safety Vest", count: 30 },
      { name: "Hard Hat", count: 24 },
      { name: "Work Gloves (pair)", count: 50 },
      { name: "Safety Cone", count: 18 },
    ],
  },
  {
    id: "3",
    name: "West Depot",
    items: [
      { name: "Generator (portable)", count: 4 },
      { name: "Extension Cord (50ft)", count: 12 },
      { name: "Power Strip", count: 9 },
      { name: "Voltage Tester", count: 7 },
    ],
  },
];
