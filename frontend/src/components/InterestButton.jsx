import { useState } from 'react';

export default function InterestButton() {
    const [interessado, setInteressado] =
        useState(false);

    return (
        <button
            type="button"
            className={`action-button interest-button ${
                interessado
                    ? 'interested'
                    : ''
            }`}
            onClick={() =>
                setInteressado(
                    !interessado
                )
            }
        >
            <span>
                {interessado
                    ? '✓'
                    : '♡'}
            </span>

            {interessado
                ? 'Interessado'
                : 'Tenho interesse'}
        </button>
    );
}