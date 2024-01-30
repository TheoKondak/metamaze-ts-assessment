import { Annotation, Entity, Input } from './types/input';
import {
  ConvertedAnnotation,
  ConvertedEntity,
  Output,
  EntityMap,
  EntityId,
  AnnotationMap,
  AnnotationId,
} from './types/output';

export const convertInput = (input: Input): Output => {
  const documents = input.documents.map((document) => {
    const entityMap: EntityMap = {},
      annotationMap: AnnotationMap = {},
      result: ConvertedAnnotation[] = [];

    document.entities.forEach((entity) => {
      entityMap[entity.id] = {
        ...{ id: entity.id, name: entity.name, type: entity.type, class: entity.class },
        children: [],
      };
    });

    document.annotations.forEach((annotation) => {
      annotationMap[annotation.id] = {
        ...{
          id: annotation.id,
          value: annotation.value,
          entity: {
            id: entityMap[annotation.entityId].id,
            name: entityMap[annotation.entityId].name,
          },
        },
        index: -1,
        children: [],
      };
    });

    const entities: ConvertedEntity[] = document.entities
      .map((entity) => convertEntity(entity, entityMap))
      .sort(sortEntities);

    document.annotations.forEach((annotation) => {
      annotation.refs.length < 1
        ? result.push(convertAnnotation(annotation, annotationMap))
        : convertAnnotation(annotation, annotationMap);
    });

    return {
      id: document.id,
      entities,
      annotations: result,
    };
  });

  return { documents };
};

const convertEntity = (entity: Entity, entityMap: EntityMap): ConvertedEntity => {
  entity.refs.forEach(
    (refId: EntityId) => entityMap[refId] && entityMap[refId].children.push({ ...entityMap[entity.id] }),
  );
  return entityMap[entity.id];
};
const convertAnnotation = (annotation: Annotation, annotationMap: AnnotationMap): ConvertedAnnotation => {
  try {
    if (annotation.indices && annotation.indices.length > 0) {
      annotationMap[annotation.id].index = annotation.indices[0].start;
    } else if (annotationMap[annotation.id].children.length > 0) {
      annotationMap[annotation.id].index = annotationMap[annotation.id].children[0].index;
    } else {
      throw new Error('Cannot assign index for annotation.');
    }

    annotation.refs.forEach((refId: AnnotationId) => {
      if (!annotationMap[refId]) {
        throw new Error(`Reference annotation with ID ${refId} not found.`);
      }
      annotationMap[refId].children.push({ ...annotationMap[annotation.id] });
    });

    const result = annotationMap[annotation.id];
    return result;
  } catch (error) {
    error instanceof Error && console.error(`Error converting annotation: ${error.message}`);
    throw error;
  }
};

const sortEntities = (entityA: ConvertedEntity, entityB: ConvertedEntity): number => {
  entityA.children.length > 1 && entityA.children.sort(sortEntities);
  return entityA.name.toLowerCase() < entityB.name.toLowerCase() ? -1 : 1;
};
