import { Annotation, Entity, Input } from './types/input';
import { ConvertedAnnotation, ConvertedEntity, Output, EntityMap, EntityId } from './types/output';

import data from './input.json';

export const convertInput = (input: Input): void => {
  const documents = input.documents.map((document) => {
    const entityMap: EntityMap = {};

    document.entities.forEach((entity) => {
      entityMap[entity.id] = {
        ...{ id: entity.id, name: entity.name, type: entity.type, class: entity.class },
        children: [],
      };
    });

    const entities: ConvertedEntity[] = document.entities.map((entity) => convertEntity(entity, entityMap));

    return {
      id: document.id,
      entities: entities,
    };
  });
  console.log(JSON.stringify(documents, null, 2));
  // return { documents };
};

const convertEntity = (entity: Entity, entityMap: EntityMap): ConvertedEntity => {
  entity.refs.forEach(
    (refId: EntityId) => entityMap[refId] && entityMap[refId].children.push({ ...entityMap[entity.id] }),
  );

  return entityMap[entity.id];
};

convertInput(data as Input);
