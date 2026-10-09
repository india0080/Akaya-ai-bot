import { useState } from 'react';
import { motion } from 'framer-motion';
import { Icon, Screen, ScreenHeader, Segmented, type IconName } from '@akaya/ui';
import { appLink, inr, platformName } from '../commerce/links';
import { Disclosure, OpenButton, PlatformTile, SampleTag } from '../commerce/LinkParts';
import { cheapest, EXPERIENCES, FLIGHTS, HOTELS, type Offer } from '../commerce/sample/travel';

type Tab = 'hotel' | 'flight' | 'experience';

/** YYYY-MM-DD in IST, `days` from today */
const istDay = (days: number) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(Date.now() + days * 864e5);

const TABS: { value: Tab; label: string; icon: IconName }[] = [
  { value: 'hotel', label: 'Stays', icon: 'bed' },
  { value: 'flight', label: 'Flights', icon: 'plane' },
  { value: 'experience', label: 'Things to do', icon: 'ticket' },
];

function PriceRow({ offers, unit }: { offers: Offer[]; unit?: string }) {
  const best = cheapest(offers);
  return (
    <div className="tr-prices">
      {offers.map((o) => (
        <span key={o.platform} className={`tr-price${o === best ? ' best' : ''}`}>
          <PlatformTile id={o.platform} size={20} />
          <b>{inr(o.price)}</b>
          {unit && <small>{unit}</small>}
        </span>
      ))}
    </div>
  );
}

export function Travel() {
  const [tab, setTab] = useState<Tab>('hotel');
  const [city, setCity] = useState('North Goa');
  const [checkin, setCheckin] = useState(istDay(14));
  const [checkout, setCheckout] = useState(istDay(17));
  const [adults, setAdults] = useState(2);
  const [from, setFrom] = useState('DEL');
  const [to, setTo] = useState('GOI');
  const [date, setDate] = useState(istDay(14));
  const [what, setWhat] = useState('Goa');
  const [searched, setSearched] = useState(true);

  const campaign = 'travel';
  const hotelParams = { city, checkin, checkout, adults };
  const flightParams = { from, to, date, adults };
  const iata = (v: string) =>
    v
      .toUpperCase()
      .replace(/[^A-Z]/g, '')
      .slice(0, 3);

  return (
    <Screen className="cm travel">
      <ScreenHeader title="Travel & Stays" sub="Hotels, flights and things to do" />
      <div className="tr-tabs">
        <Segmented<Tab>
          className="full"
          value={tab}
          onChange={setTab}
          options={TABS.map((t) => ({
            value: t.value,
            label: (
              <>
                <Icon name={t.icon} size={14} /> {t.label}
              </>
            ),
          }))}
        />
      </div>

      <form
        className="card tr-form"
        onSubmit={(e) => {
          e.preventDefault();
          setSearched(true);
        }}
      >
        {tab === 'hotel' && (
          <>
            <label className="tr-field wide">
              <span className="label">Destination</span>
              <input
                className="input"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City or area"
              />
            </label>
            <label className="tr-field">
              <span className="label">Check-in</span>
              <input className="input" type="date" value={checkin} onChange={(e) => setCheckin(e.target.value)} />
            </label>
            <label className="tr-field">
              <span className="label">Check-out</span>
              <input
                className="input"
                type="date"
                value={checkout}
                min={checkin}
                onChange={(e) => setCheckout(e.target.value)}
              />
            </label>
          </>
        )}
        {tab === 'flight' && (
          <>
            <label className="tr-field">
              <span className="label">From</span>
              <input
                className="input mono"
                value={from}
                onChange={(e) => setFrom(iata(e.target.value))}
                placeholder="DEL"
              />
            </label>
            <label className="tr-field">
              <span className="label">To</span>
              <input
                className="input mono"
                value={to}
                onChange={(e) => setTo(iata(e.target.value))}
                placeholder="GOI"
              />
            </label>
            <label className="tr-field wide">
              <span className="label">Departure</span>
              <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
          </>
        )}
        {tab === 'experience' && (
          <label className="tr-field wide">
            <span className="label">Where</span>
            <input
              className="input"
              value={what}
              onChange={(e) => setWhat(e.target.value)}
              placeholder="City or activity"
            />
          </label>
        )}
        {tab !== 'experience' && (
          <div className="tr-field wide tr-guests">
            <span className="label">{tab === 'hotel' ? 'Guests' : 'Travellers'}</span>
            <div className="tr-step">
              <button type="button" aria-label="Fewer" onClick={() => setAdults((n) => Math.max(1, n - 1))}>
                <Icon name="minus" size={15} />
              </button>
              <b>
                {adults} adult{adults > 1 ? 's' : ''}
              </b>
              <button type="button" aria-label="More" onClick={() => setAdults((n) => Math.min(9, n + 1))}>
                <Icon name="plus" size={15} />
              </button>
            </div>
          </div>
        )}
        <button className="btn btn-brand btn-block wide" type="submit">
          <Icon name="search" size={17} /> Search {TABS.find((t) => t.value === tab)!.label.toLowerCase()}
        </button>
      </form>

      {searched && (
        <>
          <div className="sec-head">
            <h3>
              {tab === 'hotel'
                ? `Stays in ${city || 'your destination'}`
                : tab === 'flight'
                  ? `${from} → ${to}`
                  : `Things to do in ${what || 'your city'}`}
            </h3>
            <SampleTag text="SAMPLE RESULTS" />
          </div>
          <div className="tr-list">
            {tab === 'hotel' &&
              HOTELS.map((h, i) => {
                const best = cheapest(h.offers);
                return (
                  <motion.article
                    key={h.id}
                    className="card tr-card"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className={`tr-thumb gi-${h.tone}`}>
                      <Icon name="bed" size={26} />
                    </div>
                    <div className="tr-body">
                      <b>{h.name}</b>
                      <small>{h.area}</small>
                      <span className="tr-meta">
                        <Icon name="star" size={12} fill /> {h.rating} · {h.reviews.toLocaleString('en-IN')} reviews
                      </span>
                      <span className="tr-perks">
                        {h.perks.map((p) => (
                          <i key={p}>{p}</i>
                        ))}
                      </span>
                    </div>
                    <PriceRow offers={h.offers} unit="/night" />
                    <div className="tr-actions">
                      <OpenButton
                        link={appLink({
                          platform: best.platform,
                          intent: 'hotel',
                          params: hotelParams,
                          campaign,
                          content: 'hotel-card',
                        })}
                        label={`Book on ${platformName(best.platform)}`}
                      />
                      {h.offers
                        .filter((o) => o !== best)
                        .map((o) => (
                          <OpenButton
                            key={o.platform}
                            variant="ghost"
                            className="btn-sm"
                            link={appLink({
                              platform: o.platform,
                              intent: 'hotel',
                              params: hotelParams,
                              campaign,
                              content: 'hotel-compare',
                            })}
                            label={platformName(o.platform)}
                          />
                        ))}
                    </div>
                  </motion.article>
                );
              })}
            {tab === 'flight' &&
              FLIGHTS.map((f, i) => {
                const best = cheapest(f.offers);
                return (
                  <motion.article
                    key={f.id}
                    className="card tr-card"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="tr-flight">
                      <span className="tr-time">
                        <b>{f.depart}</b>
                        <small>{from}</small>
                      </span>
                      <span className="tr-line">
                        <small>{f.duration}</small>
                        <i />
                        <small>{f.stops}</small>
                      </span>
                      <span className="tr-time">
                        <b>{f.arrive}</b>
                        <small>{to}</small>
                      </span>
                    </div>
                    <small className="tr-airline">
                      <Icon name="plane" size={13} /> {f.airline} · {f.code}
                    </small>
                    <PriceRow offers={f.offers} />
                    <div className="tr-actions">
                      <OpenButton
                        link={appLink({
                          platform: best.platform,
                          intent: 'flight',
                          params: flightParams,
                          campaign,
                          content: 'flight-card',
                        })}
                        label={`Book on ${platformName(best.platform)}`}
                      />
                    </div>
                  </motion.article>
                );
              })}
            {tab === 'experience' &&
              EXPERIENCES.map((x, i) => {
                const best = cheapest(x.offers);
                return (
                  <motion.article
                    key={x.id}
                    className="card tr-card"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="tr-thumb gi-pink">
                      <Icon name="ticket" size={24} />
                    </div>
                    <div className="tr-body">
                      <b>{x.title}</b>
                      <span className="tr-meta">
                        <Icon name="clock" size={12} /> {x.duration} · <Icon name="star" size={12} fill /> {x.rating} (
                        {x.reviews.toLocaleString('en-IN')})
                      </span>
                    </div>
                    <PriceRow offers={x.offers} unit="/person" />
                    <div className="tr-actions">
                      <OpenButton
                        link={appLink({
                          platform: best.platform,
                          intent: 'experience',
                          params: { q: `${x.title} ${what}` },
                          campaign,
                          content: 'experience-card',
                        })}
                        label={`Book on ${platformName(best.platform)}`}
                      />
                    </div>
                  </motion.article>
                );
              })}
          </div>
          <Disclosure className="pad-x" platforms={['booking']} />
          <p className="fine pad-x">
            Sample stays, fares and prices for the demo. Booking opens the partner's own app or site with your{' '}
            {tab === 'flight' ? 'route and date' : tab === 'hotel' ? 'dates' : 'search'}; you check live prices and pay
            there. Akaya never books or pays for you.
          </p>
        </>
      )}
    </Screen>
  );
}
