import moduleConfig from "../module.js";

export default {
    filter: (query, authData) => {
        query.$or = query.$or || [];
        for (const group of authData.groups || []) {
            const chapters = authData.groupData
                .filter((i) => i.id === "chapter" && i.group === group)
                .map((i) => i.value);
            if (chapters && chapters.length) {
                if (chapters.length > 1) {
                    for (const chapter of chapters) {
                        query.$or.push({
                            chapter,
                        });
                    }
                } else if (chapters.length === 1) {
                    const units = authData.groupData
                        .filter((i) => i.id === "unit" && i.group === group)
                        .map((i) => parseInt(i.value, 10));
                    if (units && units.length) {
                        for (const unit of units) {
                            query.$or.push({
                                chapter: chapters[0],
                                unit,
                            });
                        }
                    } else {
                        query.$or.push({
                            chapter: chapters[0],
                        });
                    }
                }
            }
        }
        if (!query.$or.length) {
            delete query.$or;
        }
        return query;
    },
    getAccessData: (
        restrictedFields,
        restrictedAreas,
        fieldsArea,
        authData,
        options,
    ) => {
        const access = {};
        const areas = {};
        for (const field of restrictedFields) {
            const accessItem = authData.groupData.find(
                (i) => i.id === `${field}FieldPermission`,
            );
            if (accessItem && accessItem.value === false) {
                access[field] = false;
                if (Object.keys(options.projection).length) {
                    delete options.projection[field];
                } else {
                    options.projection[field] = 0;
                }
            }
        }
        for (const area of restrictedAreas) {
            if (fieldsArea[area]) {
                const accessItem = authData.groupData.find(
                    (i) => i.id === `${area}AreaPermission`,
                );
                if (accessItem && accessItem.value === false) {
                    areas[area] = false;
                    for (const field of fieldsArea[area]) {
                        access[field] = false;
                        if (Object.keys(options.projection).length) {
                            delete options.projection[field];
                        } else {
                            options.projection[field] = 0;
                        }
                    }
                }
            }
        }
        return {
            access,
            areas,
        };
    },
    isSaveAllowed: (authData, data) => {
        let allowed = false;
        let chaptersFound = false;
        for (const group of authData.groups || []) {
            const chapters = authData.groupData
                .filter((i) => i.id === "chapter" && i.group === group)
                .map((i) => i.value);
            if (chapters && chapters.length) {
                chaptersFound = true;
                if (chapters.length > 1) {
                    for (const chapter of chapters) {
                        if (data.chapter === chapter) {
                            allowed = true;
                        }
                    }
                } else if (chapters.length === 1) {
                    const units = authData.groupData
                        .filter((i) => i.id === "unit" && i.group === group)
                        .map((i) => parseInt(i.value, 10));
                    if (units && units.length) {
                        for (const unit of units) {
                            if (
                                data.chapter === chapters[0] &&
                                String(data.unit) === String(unit)
                            ) {
                                allowed = true;
                            }
                        }
                    } else if (data.chapter === chapters[0]) {
                        allowed = true;
                    }
                }
            }
        }
        if (!chaptersFound) {
            allowed = true;
        }
        return allowed;
    },
    saveHistoryData: async (
        parent,
        req,
        formData,
        existingRecord,
        data,
        authData,
        access,
    ) => {
        const changes = existingRecord
            ? (
                  await req.findUpdates(
                      formData,
                      existingRecord,
                      data._default,
                      {
                          ignore: ["_id", "id"],
                      },
                  )
              ).filter((i) => access[i.id] !== false)
            : null;
        if ((changes && changes.length) || !existingRecord) {
            await parent.mongo.db
                .collection(parent.systemConfig.collections.history)
                .insertOne({
                    recordId: data._id.toString(),
                    userId: authData._id.toString(),
                    updated: new Date(),
                    changes,
                    data: data._default,
                    module: moduleConfig.id,
                });
        }
    },
};
