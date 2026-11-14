import {
  describeLocationAccuracy,
  formatSpread,
} from '../features/events/utilities/locationAccuracy';

describe('describeLocationAccuracy', () => {
  it('says nothing for an address somebody typed', () => {
    expect(describeLocationAccuracy({ locationApprox: false })).toBeNull();
  });

  it('says nothing when the event carries no accuracy at all', () => {
    expect(describeLocationAccuracy(undefined)).toBeNull();
    expect(describeLocationAccuracy({})).toBeNull();
    expect(describeLocationAccuracy({ locationApprox: null })).toBeNull();
  });

  it('names the spread for a city-sized geocode', () => {
    expect(
      describeLocationAccuracy({
        locationApprox: true,
        locationRadiusMeters: 14200,
        locationPrecision: 'approximate',
      }),
    ).toEqual({ label: 'Ungefärlig plats', spread: 'inom ca 14 km' });
  });

  it('calls an interpolated street address what it is', () => {
    expect(
      describeLocationAccuracy({
        locationApprox: true,
        locationRadiusMeters: 180,
        locationPrecision: 'range_interpolated',
      }),
    ).toEqual({ label: 'Ungefärlig gatuadress', spread: 'inom ca 200 m' });
  });

  it('leaves the spread out when the geocoder gave no viewport', () => {
    expect(describeLocationAccuracy({ locationApprox: true })).toEqual({
      label: 'Ungefärlig plats',
    });
  });

  it('ignores a radius that is not a usable number', () => {
    expect(
      describeLocationAccuracy({ locationApprox: true, locationRadiusMeters: 0 }),
    ).toEqual({ label: 'Ungefärlig plats' });
    expect(
      describeLocationAccuracy({ locationApprox: true, locationRadiusMeters: '14200' }),
    ).toEqual({ label: 'Ungefärlig plats' });
    expect(
      describeLocationAccuracy({ locationApprox: true, locationRadiusMeters: NaN }),
    ).toEqual({ label: 'Ungefärlig plats' });
  });
});

describe('formatSpread', () => {
  it('rounds metres to the nearest fifty', () => {
    expect(formatSpread(120)).toBe('100 m');
    expect(formatSpread(180)).toBe('200 m');
  });

  it('never claims better than fifty metres', () => {
    expect(formatSpread(12)).toBe('50 m');
  });

  it('switches to kilometres with one decimal', () => {
    expect(formatSpread(1500)).toBe('1,5 km');
    expect(formatSpread(9400)).toBe('9,4 km');
  });

  it('drops the decimal once the number is large', () => {
    expect(formatSpread(14200)).toBe('14 km');
    expect(formatSpread(42000)).toBe('42 km');
  });
});
