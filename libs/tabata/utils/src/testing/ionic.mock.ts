/**
 * Mock for Ionic modules used in unit tests.
 * Import via @silver/tabata/testing in jest moduleNameMapper.
 * Safe to load in non-test environments (uses no-ops when jest is undefined).
 */
/// <reference types="jest" />

export const IonicModule = {};
export const ToastController = class {};

/** Mock for ModalController (e.g. when testing components that open modals). Includes dismiss for specs that assert on it. */
export const mockModalController = {
    create:
        typeof jest !== 'undefined'
            ? jest.fn().mockResolvedValue({
                  present: jest.fn(),
                  onDidDismiss: jest.fn().mockResolvedValue({}),
                  dismiss:
                      typeof jest !== 'undefined'
                          ? jest.fn()
                          : () => {
                                return;
                            }
              })
            : ((() => {
                  return Promise.resolve({
                      present: () => {
                          return;
                      },
                      onDidDismiss: Promise.resolve({}),
                      dismiss: () => {
                          return;
                      }
                  });
              }) as unknown as jest.Mock),
    dismiss:
        typeof jest !== 'undefined'
            ? jest.fn()
            : () => {
                  return;
              }
};
