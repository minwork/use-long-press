import React from 'react';

export function mockEvent<EventType extends React.SyntheticEvent = React.SyntheticEvent>(
    props?: Partial<EventType>
): EventType {
    return {
        ...props,
    } as EventType;
}
