/**
 * Taxonomy of Work Sectors and Categories for ShramSetu
 * Total: 6 Sectors, 56 Categories
 */

export const WORK_SECTORS = [
  {
    id: 'construction',
    label: 'Construction & Infrastructure',
    iconName: 'HardHat',
    color: 'amber',
    skills: [
      'Mason', 'Electrician', 'Plumber', 'Painter', 'Welder', 
      'Solar Installer', 'Bar Bender', 'Tiles Layer', 'Carpenter',
      'HVAC Technician', 'Scaffolder', 'Formwork Worker'
    ]
  },
  {
    id: 'home_services',
    label: 'Home & Facility Services',
    iconName: 'Home',
    color: 'emerald',
    skills: [
      'Cleaner', 'Maid', 'Cook', 'Pest Control', 'Packer & Mover', 
      'Appliance Repair', 'Gardener', 'Laundry', 'Security Guard',
      'Watchman', 'Pool Maintenance'
    ]
  },
  {
    id: 'events',
    label: 'Events & Hospitality',
    iconName: 'Users',
    color: 'purple',
    skills: [
      'Setup Crew', 'Catering Staff', 'Waiter', 'AV Technician', 
      'Decorator', 'Hotel Staff', 'Host/Hostess', 'Event Security',
      'Valet Driver', 'Housekeeping'
    ]
  },
  {
    id: 'logistics',
    label: 'Logistics & Delivery',
    iconName: 'Truck',
    color: 'blue',
    skills: [
      'Loader/Unloader', 'Delivery Driver', 'Bike Rider', 'Warehouse Worker', 
      'Forklift Operator', 'Factory Hand', 'Inventory Clerk', 'Courier'
    ]
  },
  {
    id: 'agriculture',
    label: 'Agriculture & Outdoor',
    iconName: 'Sprout',
    color: 'green',
    skills: [
      'Farm Labour', 'Animal Husbandry', 'Plantation Worker', 'Quarry Worker',
      'Landscaper', 'Irrigation Worker', 'Tractor Driver'
    ]
  },
  {
    id: 'technical',
    label: 'Technical Trades',
    iconName: 'Settings',
    color: 'indigo',
    skills: [
      'CCTV Installer', 'Solar Maintenance', 'Tailor', 'Beautician', 
      'Printing Press Op', 'Telecom Cabling', 'Network Tech', 'AC Repair'
    ]
  }
];

// Flattened list for simple lookups
export const ALL_SKILLS = WORK_SECTORS.flatMap(sector => sector.skills);

// Map sector colors to Tailwind classes
export const SECTOR_COLORS = {
  amber: 'bg-amber-500/10 text-amber-600 border-amber-200',
  emerald: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
  purple: 'bg-purple-500/10 text-purple-600 border-purple-200',
  blue: 'bg-blue-500/10 text-blue-600 border-blue-200',
  green: 'bg-green-500/10 text-green-600 border-green-200',
  indigo: 'bg-indigo-500/10 text-indigo-600 border-indigo-200'
};
