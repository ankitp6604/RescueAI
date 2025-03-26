import prisma from './client.js';
import fetch from 'node-fetch';

async function fetchFacilities(type, query) {
  const overpassUrl = 'https://overpass-api.de/api/interpreter';
  
  // Simplified query for testing
  const queries = {
    HOSPITAL: `
      [out:json][timeout:25];
      area["name"="Bengaluru"]->.searchArea;
      (
        node["amenity"="hospital"]
        (area.searchArea);
      );
      out body;
      >;
      out skel qt;
    `,
    POLICE: `
      [out:json][timeout:25];
      area["name"="Bengaluru"]->.searchArea;
      (
        node["amenity"="police"]
        (area.searchArea);
      );
      out body;
      >;
      out skel qt;
    `,
    FIRE: `
      [out:json][timeout:25];
      area["name"="Bengaluru"]->.searchArea;
      (
        node["amenity"="fire_station"]
        (area.searchArea);
      );
      out body;
      >;
      out skel qt;
    `
  };

  try {
    console.log(`Sending query for ${type}:`, queries[type]); // Debug log

    const response = await fetch(overpassUrl, {
      method: 'POST',
      body: `data=${encodeURIComponent(queries[type])}`
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Raw response for ${type}:`, JSON.stringify(data, null, 2)); // Debug log
    
    // Filter and clean the facility data
    return data.elements
      .filter(element => element.tags && element.tags.name) // Only include facilities with names
      .map(element => ({
        name: element.tags.name,
        type: type,
        latitude: element.lat,
        longitude: element.lon,
        address: element.tags['addr:full'] || 
                `${element.tags['addr:street'] || ''} ${element.tags['addr:city'] || 'Bengaluru'}`.trim(),
        city: 'Bengaluru',
        province: 'Karnataka'
      }));
  } catch (error) {
    console.error(`Error fetching ${type} facilities:`, error);
    console.error('Full error:', error.stack); // Debug log
    return [];
  }
}

async function main() {
  try {
    // Clear existing facilities
    await prisma.emergencyFacility.deleteMany();
    console.log('Cleared existing facilities');

    // Add delay between requests to avoid rate limiting
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    // Fetch each type of facility
    const facilityTypes = ['HOSPITAL', 'POLICE', 'FIRE'];
    
    for (const type of facilityTypes) {
      console.log(`Fetching ${type} facilities...`);
      const facilities = await fetchFacilities(type);
      console.log(`Found ${facilities.length} ${type} facilities`);

      if (facilities.length > 0) {
        console.log('Sample facility:', facilities[0]); // Debug log
      }

      // Create facilities in database
      for (const facility of facilities) {
        try {
          await prisma.emergencyFacility.create({
            data: facility
          });
          console.log(`Created ${type} facility: ${facility.name}`);
        } catch (error) {
          console.error(`Error creating facility: ${facility.name}`, error);
        }
      }

      // Wait 2 seconds between facility types to avoid rate limiting
      await delay(2000);
    }

    console.log('Seeding completed successfully');
  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
