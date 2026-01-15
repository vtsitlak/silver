import { Request, Response } from 'express';
import { VEHICLES } from './db-data';

export function getAll(res: Response) {

  console.log('Retrieving vehicles data ...');

  setTimeout(() => {

    res.status(200).json(Object.values(VEHICLES));

  }, 1000);

}

export function getByFilter(req: Request, res: Response) {

  console.log('Retrieving filtered vehicles data ...');

  const { type, brand, color } = req.body || {};

  setTimeout(() => {
    let vehicles = Object.values(VEHICLES);

    // Apply filters if provided
    if (type && typeof type === 'string' && type !== '') {
      vehicles = vehicles.filter(v => v.type === type);
    }

    if (brand && typeof brand === 'string' && brand !== '') {
      vehicles = vehicles.filter(v => v.brand === brand);
    }

    if (color && typeof color === 'string' && color !== '') {
      vehicles = vehicles.filter(v => v.colors.indexOf(color) > -1);
    }

    res.status(200).json(vehicles);

  }, 1000);

}


