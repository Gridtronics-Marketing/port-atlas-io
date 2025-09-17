-- Add basic equipment seed data for inventory management (using valid equipment types)
INSERT INTO public.equipment (name, equipment_type, make, model, status, cost, firmware_version) VALUES
('Cat 6 Cable', 'Cable', 'Panduit', 'UTP6A', 'Available', 1.50, ''),
('Cat 6A Cable', 'Cable', 'Panduit', 'STP6A', 'Available', 2.25, ''),
('RJ45 Connectors', 'Cable', 'Panduit', 'MP588', 'Available', 0.45, ''),
('24-Port Patch Panel', 'Patch Panel', 'Panduit', 'DP24', 'Available', 125.00, ''),
('48-Port Patch Panel', 'Patch Panel', 'Panduit', 'DP48', 'Available', 220.00, ''),
('Network Switch 24-Port', 'Switch', 'Cisco', 'SG220-26', 'Available', 450.00, '2.1.4'),
('Network Switch 48-Port', 'Switch', 'Cisco', 'SG350-48', 'Available', 850.00, '2.1.4'),
('Cable Tester', 'Test Equipment', 'Fluke', 'DTX-1800', 'Available', 8500.00, '7.20'),
('Crimping Tool', 'Tool', 'Klein', 'VDV226-011', 'Available', 45.00, ''),
('Cable Stripper', 'Tool', 'Klein', 'VDV100-061', 'Available', 25.00, ''),
('Wall Plates Single', 'Cable', 'Leviton', '41080-1WP', 'Available', 3.50, ''),
('Wall Plates Dual', 'Cable', 'Leviton', '41080-2WP', 'Available', 4.25, ''),
('Keystone Jacks Cat6', 'Cable', 'Panduit', 'CJ688TGBU', 'Available', 8.75, ''),
('Fiber Optic Cable SM', 'Cable', 'Corning', 'SMF-28e+', 'Available', 3.25, ''),
('Fiber Patch Cord LC-LC', 'Cable', 'Corning', 'LC-LC-SM-3M', 'Available', 15.50, ''),
('Cisco Router ISR4321', 'Router', 'Cisco', 'ISR4321', 'Available', 2500.00, '16.09.05'),
('Dell PowerEdge Server', 'Server', 'Dell', 'R640', 'Available', 5500.00, ''),
('APC UPS 1500VA', 'UPS', 'APC', 'Smart-UPS 1500', 'Available', 750.00, ''),
('SonicWall Firewall', 'Firewall', 'SonicWall', 'TZ470', 'Available', 350.00, '7.0.1');

-- Add some sample rack data
INSERT INTO public.racks (rack_name, location_id, rack_units, floor, room, power_available, cooling_required, x_coordinate, y_coordinate) VALUES
('Server Rack A1', NULL, 42, 1, 'Server Room A', 20, true, 100, 100),
('Network Rack B1', NULL, 24, 1, 'Network Closet B', 10, false, 200, 150),
('Distribution Rack C1', NULL, 12, 2, 'IDF Room C', 5, false, 300, 200);