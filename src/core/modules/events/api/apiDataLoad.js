import { ObjectId } from "mongodb";
import FormData from "../data/form.js";
import moduleConfig from "../module.js";

export default () => ({
    async handler(req, rep) {
        try {
            const authData = await req.auth.getData(req.auth.methods.HEADERS);
            if (
                !authData ||
                !authData.groupData ||
                !authData.groupData.find(
                    (i) => i.id === "admin" && i.value === true,
                )
            ) {
                return rep.error(
                    {
                        message: "Access Denied",
                    },
                    403,
                );
            }
            if (
                !req.validateDataLoad() ||
                !req.body.language ||
                typeof req.body.language !== "string" ||
                req.body.language.length !== 5
            ) {
                return rep.error({
                    message: "validation_error",
                });
            }
            const formData = new FormData();
            const item = await this.mongo.db
                .collection(moduleConfig.collections.events)
                .findOne({
                    _id: new ObjectId(req.body.id),
                });
            let cityData = null;
            if (item.geoNameIdCity) {
                const projection = {
                    "en-us": 1,
                };
                projection[req.body.language] = 1;
                cityData = await this.mongo.db
                    .collection(this.systemConfig.collections.geoCities)
                    .findOne(
                        {
                            _id: String(item.geoNameIdCity),
                        },
                        {
                            projection,
                        },
                    );
            }
            let countryData = null;
            if (item.geoNameIdCountry) {
                const projection = {
                    "en-us": 1,
                };
                projection[req.body.language] = 1;
                countryData = await this.mongo.db
                    .collection(this.systemConfig.collections.geoCountries)
                    .findOne(
                        {
                            _id: String(item.geoNameIdCountry),
                        },
                        {
                            projection,
                        },
                    );
            }
            const locationArr = [];
            if (countryData) {
                let continent = countryData[req.body.language]
                    ? countryData[req.body.language].continent
                    : null;
                if (!continent) {
                    continent = countryData["en-us"]
                        ? countryData["en-us"].continent
                        : null;
                }
                if (continent) {
                    locationArr.push(continent);
                }
                let country = countryData[req.body.language]
                    ? countryData[req.body.language].country
                    : null;
                if (!country) {
                    country = countryData["en-us"]
                        ? countryData["en-us"].country
                        : null;
                }
                if (country) {
                    locationArr.push(country);
                }
            }
            if (cityData) {
                let city = cityData[req.body.language];
                if (!city) {
                    city = cityData["en-us"] || null;
                }
                if (city) {
                    locationArr.push(city);
                }
            }
            if (locationArr.length) {
                item.location = locationArr.join(", ");
            } else {
                item.location = null;
            }
            const data = req.processFormData(
                {
                    _default: item,
                },
                formData.getFieldsFlat(),
                [
                    {
                        id: "_default",
                    },
                ],
            );
            delete data._default.password;
            return rep.code(200).send(data);
        } catch (e) {
            this.log.error(e);
            return Promise.reject(e);
        }
    },
});
